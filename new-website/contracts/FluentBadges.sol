// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v4.9.3/contracts/access/AccessControl.sol";

contract FluentBadges is ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 private _tokenIdCounter;

    event BadgeMinted(address indexed to, uint256 tokenId, string uri, string domain);

    constructor() ERC721("FluentBadges", "FLNT") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _tokenIdCounter = 1;
    }

    function mint(address to, string memory uri, string memory domain)
        public
    {
        uint256 tokenId = _tokenIdCounter++;
        _mint(to, tokenId);
        _setTokenURI(tokenId, uri);
        emit BadgeMinted(to, tokenId, uri, domain);
    }

    // Enforce soulbound (non-transferable) behavior
    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal override(ERC721)
    {
        require(
            from == address(0) || to == address(0),
            "Soulbound: token cannot be transferred"
        );
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    // Required overrides per OpenZeppelin ERC721URIStorage pattern
    function _burn(uint256 tokenId)
        internal
        override(ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
