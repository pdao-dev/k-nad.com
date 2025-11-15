import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./user.schema";

export const images = sqliteTable("images", {
	id: text("id").primaryKey(),
	userId: text("user_id")
		.notNull()
		.references(() => users.id),
	title: text("title"),
	description: text("description"),
	imageUrl: text("image_url").notNull(),
	thumbnailUrl: text("thumbnail_url"),
	r2Key: text("r2_key").notNull(),
	metadataUrl: text("metadata_url"),
	metadataKey: text("metadata_key"),

	// NFT 정보
	tokenId: text("token_id"),
	contractAddress: text("contract_address"),
	transactionHash: text("transaction_hash"),
	mintedAt: integer("minted_at", { mode: "timestamp" }),
	isApproved: integer("is_approved", { mode: "boolean" }).default(false),
	approvedAt: integer("approved_at", { mode: "timestamp" }),

	// 신고 관련
	isReported: integer("is_reported", { mode: "boolean" }).default(false),
	reportCount: integer("report_count").default(0),

	createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
		() => new Date(),
	),
	updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
		() => new Date(),
	),
});
