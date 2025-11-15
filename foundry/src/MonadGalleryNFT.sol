// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256 balance);

    function ownerOf(uint256 tokenId) external view returns (address owner);

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;

    function safeTransferFrom(address from, address to, uint256 tokenId) external;

    function transferFrom(address from, address to, uint256 tokenId) external;

    function approve(address to, uint256 tokenId) external;

    function setApprovalForAll(address operator, bool approved) external;

    function getApproved(uint256 tokenId) external view returns (address operator);

    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);

    function symbol() external view returns (string memory);

    function tokenURI(uint256 tokenId) external view returns (string memory);
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data)
        external
        returns (bytes4);
}

contract MonadGalleryNFT is IERC721, IERC721Metadata {
    struct TokenMetadata {
        string title;
        string description;
        string mediaUrl;
        string metadataUrl;
    }

    struct MetadataInput {
        string title;
        string description;
        string mediaUrl;
        string metadataUrl;
    }

    string private _name;
    string private _symbol;
    address public owner;
    uint256 private _nextTokenId = 1;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(uint256 => TokenMetadata) private _tokenMetadata;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event MetadataUpdated(uint256 indexed tokenId, string metadataUrl, string mediaUrl);

    error Unauthorized();
    error InvalidAddress();
    error NonexistentToken();
    error NotOwnerNorApproved();
    error TransfersDisabled();
    error MintToZeroAddress();
    error MetadataRequired();
    error UnsafeRecipient(address recipient);

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    constructor(string memory name_, string memory symbol_) {
        owner = msg.sender;
        _name = name_;
        _symbol = symbol_;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert InvalidAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function supportsInterface(bytes4 interfaceId) external view override returns (bool) {
        return interfaceId == type(IERC165).interfaceId
            || interfaceId == type(IERC721).interfaceId
            || interfaceId == type(IERC721Metadata).interfaceId;
    }

    function name() external view override returns (string memory) {
        return _name;
    }

    function symbol() external view override returns (string memory) {
        return _symbol;
    }

    function balanceOf(address tokenOwner) public view override returns (uint256) {
        if (tokenOwner == address(0)) revert InvalidAddress();
        return _balances[tokenOwner];
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        address tokenOwner = _owners[tokenId];
        if (tokenOwner == address(0)) revert NonexistentToken();
        return tokenOwner;
    }

    function tokenURI(uint256 tokenId) external view override returns (string memory) {
        _requireMinted(tokenId);
        return _tokenMetadata[tokenId].metadataUrl;
    }

    function getTokenMetadata(uint256 tokenId) external view returns (TokenMetadata memory) {
        _requireMinted(tokenId);
        return _tokenMetadata[tokenId];
    }

    function approve(address to, uint256 tokenId) public override {
        address tokenOwner = ownerOf(tokenId);
        if (to == tokenOwner) revert InvalidAddress();
        if (msg.sender != tokenOwner && !isApprovedForAll(tokenOwner, msg.sender)) {
            revert NotOwnerNorApproved();
        }

        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view override returns (address) {
        _requireMinted(tokenId);
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external override {
        if (operator == msg.sender) revert InvalidAddress();
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address tokenOwner, address operator) public view override returns (bool) {
        return _operatorApprovals[tokenOwner][operator];
    }

    function transferFrom(address, address, uint256) public pure override {
        revert TransfersDisabled();
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) public pure override {
        revert TransfersDisabled();
    }

    function safeTransferFrom(address, address, uint256) external pure override {
        revert TransfersDisabled();
    }

    function mint(address to, MetadataInput calldata metadata) external onlyOwner returns (uint256) {
        return _mintWithMetadata(to, metadata);
    }

    function mintWithMetadata(MetadataInput calldata metadata) external returns (uint256) {
        return _mintWithMetadata(msg.sender, metadata);
    }

    function safeMint(address to, MetadataInput calldata metadata, bytes calldata data)
        external
        onlyOwner
        returns (uint256)
    {
        uint256 tokenId = _mintWithMetadata(to, metadata);

        if (!_checkOnERC721Received(msg.sender, address(0), to, tokenId, data)) {
            revert UnsafeRecipient(to);
        }

        return tokenId;
    }

    function safeMintWithMetadata(MetadataInput calldata metadata) external returns (uint256) {
        uint256 tokenId = _mintWithMetadata(msg.sender, metadata);

        if (!_checkOnERC721Received(msg.sender, address(0), msg.sender, tokenId, "")) {
            revert UnsafeRecipient(msg.sender);
        }

        return tokenId;
    }

    function updateMetadata(uint256 tokenId, MetadataInput calldata metadata) external {
        if (!_isApprovedOrOwner(msg.sender, tokenId)) revert NotOwnerNorApproved();
        if (bytes(metadata.metadataUrl).length == 0) revert MetadataRequired();

        _tokenMetadata[tokenId] =
            TokenMetadata(metadata.title, metadata.description, metadata.mediaUrl, metadata.metadataUrl);

        emit MetadataUpdated(tokenId, metadata.metadataUrl, metadata.mediaUrl);
    }

    function burn(uint256 tokenId) external {
        if (!_isApprovedOrOwner(msg.sender, tokenId)) revert NotOwnerNorApproved();
        address tokenOwner = ownerOf(tokenId);

        _approve(address(0), tokenId);

        _balances[tokenOwner] -= 1;
        delete _owners[tokenId];
        delete _tokenMetadata[tokenId];

        emit Transfer(tokenOwner, address(0), tokenId);
    }

    function _mintWithMetadata(address to, MetadataInput calldata metadata) private returns (uint256 tokenId) {
        if (to == address(0)) revert MintToZeroAddress();
        if (bytes(metadata.metadataUrl).length == 0) revert MetadataRequired();

        tokenId = _nextTokenId;
        _nextTokenId += 1;

        _balances[to] += 1;
        _owners[tokenId] = to;

        _tokenMetadata[tokenId] =
            TokenMetadata(metadata.title, metadata.description, metadata.mediaUrl, metadata.metadataUrl);

        emit Transfer(address(0), to, tokenId);
        emit MetadataUpdated(tokenId, metadata.metadataUrl, metadata.mediaUrl);
    }

    function _approve(address to, uint256 tokenId) private {
        _tokenApprovals[tokenId] = to;
        emit Approval(ownerOf(tokenId), to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) private view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return (spender == tokenOwner || getApproved(tokenId) == spender || isApprovedForAll(tokenOwner, spender));
    }

    function _checkOnERC721Received(
        address operator,
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) private returns (bool) {
        if (to.code.length == 0) {
            return true;
        }

        (bool success, bytes memory returndata) = to.call(
            abi.encodeWithSelector(IERC721Receiver.onERC721Received.selector, operator, from, tokenId, data)
        );

        if (!success) {
            return false;
        }

        bytes4 retval = abi.decode(returndata, (bytes4));
        return retval == IERC721Receiver.onERC721Received.selector;
    }

    function _requireMinted(uint256 tokenId) private view {
        if (_owners[tokenId] == address(0)) revert NonexistentToken();
    }
}
