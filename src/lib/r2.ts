import { getRuntimeEnv, type RuntimeEnv } from "@/lib/runtime";

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

interface PutObjectRequest {
  key: string;
  body: ArrayBuffer;
  contentType: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

interface S3Config {
  baseUrl: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

const CACHE_CONTROL = "public, max-age=31536000";
const AWS_REGION = "auto";
const AWS_SERVICE = "s3";

function assertServerRuntime() {
  if (typeof window !== "undefined") {
    throw new Error("R2 uploads must run on the server/edge runtime.");
  }
}

function hasR2Binding(
  env: RuntimeEnv,
): env is RuntimeEnv & { k_nad_prod: R2Bucket } {
  return Boolean("k_nad_prod" in env && env.k_nad_prod);
}

function assertBucketBinding(
  env: RuntimeEnv,
): asserts env is RuntimeEnv & { k_nad_prod: R2Bucket } {
  if (!hasR2Binding(env)) {
    throw new Error("R2 bucket binding k_nad_prod is not configured");
  }
}

function ensurePublicBaseUrl(env: RuntimeEnv): string {
  const base = env.CLOUDFLARE_R2_URL as string | undefined;

  if (!base) {
    throw new Error("CLOUDFLARE_R2_URL is missing");
  }

  return base.replace(/\/$/, "");
}

function ensureS3Config(env: RuntimeEnv): S3Config {
  const base = env.CLOUDFLARE_R2_S3_API_URL as string | undefined;
  const accessKeyId = env.CLOUDFLARE_R2_ACCESS_KEY_ID as string | undefined;
  const secretAccessKey = env.CLOUDFLARE_R2_SECRET_ACCESS_KEY as
    | string
    | undefined;

  if (!base || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 S3 configuration missing (CLOUDFLARE_R2_S3_API_URL, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY).",
    );
  }

  return {
    baseUrl: base.replace(/\/$/, ""),
    accessKeyId,
    secretAccessKey,
    region: AWS_REGION,
  };
}

function normalizeFolder(folder: string) {
  return folder.replace(/^\/+|\/+$/g, "") || "uploads";
}

function sanitizeKey(key: string) {
  return key.replace(/^\/+/, "");
}

function createObjectKey(folder: string, extension: string) {
  const unique =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  const sanitizedFolder = normalizeFolder(folder);

  return `${sanitizedFolder}/${Date.now()}_${unique}${extension ? `.${extension}` : ""}`;
}

export async function uploadToR2(
  file: File,
  folder: string = "uploads",
): Promise<UploadResult> {
  try {
    assertServerRuntime();
    const env = await getRuntimeEnv();

    const extension = file.name.split(".").pop() || "bin";
    const key = createObjectKey(folder, extension);
    const buffer = await file.arrayBuffer();
    const contentType = file.type || "application/octet-stream";

    await putObject(env, {
      key,
      body: buffer,
      contentType,
      cacheControl: CACHE_CONTROL,
      metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        size: file.size.toString(),
      },
    });

    return {
      success: true,
      key,
      url: `${ensurePublicBaseUrl(env)}/${key}`,
    };
  } catch (error) {
    console.error("R2 upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export async function uploadJsonToR2(
  payload: unknown,
  options: { folder?: string; filename?: string } = {},
): Promise<UploadResult> {
  try {
    assertServerRuntime();
    const env = await getRuntimeEnv();

    const folder = options.folder ?? "metadata";
    const key = options.filename
      ? sanitizeKey(options.filename)
      : createObjectKey(folder, "json");
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload, null, 2));
    const buffer = toArrayBuffer(data);

    await putObject(env, {
      key,
      body: buffer,
      contentType: "application/json; charset=utf-8",
      cacheControl: CACHE_CONTROL,
    });

    return {
      success: true,
      key,
      url: `${ensurePublicBaseUrl(env)}/${key}`,
    };
  } catch (error) {
    console.error("R2 JSON upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Metadata upload failed",
    };
  }
}

export async function getFromR2(key: string): Promise<R2Object | null> {
  try {
    assertServerRuntime();
    const env = await getRuntimeEnv();
    assertBucketBinding(env);
    return env.k_nad_prod.get(key);
  } catch (error) {
    console.error("Error getting data from R2", error);
    return null;
  }
}

export async function listR2Files() {}

export async function deleteFromR2(key: string): Promise<void> {
  try {
    assertServerRuntime();
    const env = await getRuntimeEnv();
    const sanitizedKey = sanitizeKey(key);

    if (hasR2Binding(env)) {
      await env.k_nad_prod.delete(sanitizedKey);
      return;
    }

    const config = ensureS3Config(env);
    await sendSignedS3Request(
      {
        method: "DELETE",
        key: sanitizedKey,
      },
      config,
    );
  } catch (error) {
    console.error(`Failed to delete R2 object ${key}`, error);
  }
}

async function putObject(env: RuntimeEnv, request: PutObjectRequest) {
  const sanitizedKey = sanitizeKey(request.key);

  if (hasR2Binding(env)) {
    await env.k_nad_prod.put(sanitizedKey, request.body, {
      httpMetadata: {
        contentType: request.contentType,
        cacheControl: request.cacheControl,
      },
      customMetadata: request.metadata,
    });
    return;
  }

  const config = ensureS3Config(env);
  await putObjectViaS3(
    {
      ...request,
      key: sanitizedKey,
    },
    config,
  );
}

async function putObjectViaS3(request: PutObjectRequest, config: S3Config) {
  const metadataHeaders = buildMetadataHeaders(request.metadata);
  const headers: Record<string, string> = {
    "content-type": request.contentType,
    "content-length": request.body.byteLength.toString(),
  };

  if (request.cacheControl) {
    headers["cache-control"] = request.cacheControl;
  }

  Object.assign(headers, metadataHeaders);

  await sendSignedS3Request(
    {
      method: "PUT",
      key: request.key,
      body: request.body,
      headers,
    },
    config,
  );
}

interface SignedRequestOptions {
  method: string;
  key: string;
  body?: ArrayBuffer;
  headers?: Record<string, string>;
}

async function sendSignedS3Request(
  options: SignedRequestOptions,
  config: S3Config,
) {
  const method = options.method.toUpperCase();
  const url = new URL(`${config.baseUrl}/${sanitizeKey(options.key)}`);
  const body = options.body ?? new ArrayBuffer(0);
  const payloadHash = await sha256Hex(body);
  const { amzDate, dateStamp } = getAmzDateParts(new Date());

  const headersForSigning: Record<string, string> = {
    host: url.host,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
  };

  if (options.headers) {
    for (const [name, value] of Object.entries(options.headers)) {
      if (value === undefined || value === null) {
        continue;
      }
      headersForSigning[name.toLowerCase()] = value.toString();
    }
  }

  const { canonicalHeaders, signedHeaders } =
    buildCanonicalHeaders(headersForSigning);

  const canonicalRequest = [
    method,
    buildCanonicalUri(url.pathname),
    buildCanonicalQueryString(url.searchParams),
    canonicalHeaders,
    "",
    signedHeaders,
    payloadHash,
  ].join("\n");

  const credentialScope = `${dateStamp}/${config.region}/${AWS_SERVICE}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    credentialScope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  const signingKey = await deriveSigningKey(
    config.secretAccessKey,
    dateStamp,
    config.region,
    AWS_SERVICE,
  );
  const signature = bufferToHex(await hmac(signingKey, stringToSign));

  const authHeader = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  const requestHeaders = new Headers();

  for (const [name, value] of Object.entries(headersForSigning)) {
    if (name === "host") continue;
    requestHeaders.set(name, value);
  }
  requestHeaders.set("authorization", authHeader);

  const requestInit: RequestInit = {
    method,
    headers: requestHeaders,
  };

  if (method === "PUT" || method === "POST") {
    requestInit.body = body;
  }

  const response = await fetch(url.toString(), requestInit);

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `R2 S3 ${method} failed (${response.status}): ${
        errorText || response.statusText
      }`,
    );
  }
}

function buildMetadataHeaders(metadata?: Record<string, string>) {
  if (!metadata) return {};

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value == null) continue;
    const headerKey = key
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");
    headers[`x-amz-meta-${headerKey}`] = sanitizeMetadataValue(value);
  }
  return headers;
}

function sanitizeMetadataValue(value: string) {
  return value.replace(/[\r\n]+/g, " ").slice(0, 1024);
}

function toArrayBuffer(data: ArrayBuffer | ArrayBufferView): ArrayBuffer {
  if (data instanceof ArrayBuffer) {
    return data;
  }
  const view = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  const copy = new Uint8Array(view.length);
  copy.set(view);
  return copy.buffer;
}

function buildCanonicalHeaders(headers: Record<string, string>) {
  const normalized = Object.entries(headers).map(([name, value]) => [
    name.toLowerCase(),
    value.trim().replace(/\s+/g, " "),
  ]);

  normalized.sort((a, b) => {
    if (a[0] < b[0]) return -1;
    if (a[0] > b[0]) return 1;
    return 0;
  });

  return {
    canonicalHeaders: normalized
      .map(([name, value]) => `${name}:${value}\n`)
      .join(""),
    signedHeaders: normalized.map(([name]) => name).join(";"),
  };
}

function buildCanonicalUri(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  return pathname
    .split("/")
    .map((segment) => encodeRfc3986(segment))
    .join("/");
}

function buildCanonicalQueryString(params: URLSearchParams) {
  if ([...params.keys()].length === 0) return "";
  const entries = [...params.entries()].map(([key, value]) => [
    encodeRfc3986(key),
    encodeRfc3986(value),
  ]);
  entries.sort((a, b) => {
    if (a[0] === b[0]) {
      return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0;
    }
    return a[0] < b[0] ? -1 : 1;
  });
  return entries.map(([key, value]) => `${key}=${value}`).join("&");
}

function encodeRfc3986(value: string) {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function getAmzDateParts(date: Date) {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  const hours = `${date.getUTCHours()}`.padStart(2, "0");
  const minutes = `${date.getUTCMinutes()}`.padStart(2, "0");
  const seconds = `${date.getUTCSeconds()}`.padStart(2, "0");

  const dateStamp = `${year}${month}${day}`;
  const amzDate = `${dateStamp}T${hours}${minutes}${seconds}Z`;

  return { amzDate, dateStamp };
}

async function sha256Hex(data: ArrayBuffer | string) {
  const encoder = new TextEncoder();
  const bytes =
    typeof data === "string" ? encoder.encode(data) : new Uint8Array(data);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return bufferToHex(hash);
}

async function hmac(key: ArrayBuffer | ArrayBufferView | string, data: string) {
  const encoder = new TextEncoder();
  const keyData =
    typeof key === "string"
      ? encoder.encode(key)
      : key instanceof ArrayBuffer
        ? key
        : toArrayBuffer(key);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(data));
}

async function deriveSigningKey(
  secret: string,
  dateStamp: string,
  region: string,
  service: string,
) {
  const kDate = await hmac(`AWS4${secret}`, dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

function bufferToHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
