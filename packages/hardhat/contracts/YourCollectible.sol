pragma solidity >=0.6.0 <0.7.0;
//SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@chainlink/contracts/src/v0.6/VRFConsumerBase.sol";

// GET LISTED ON OPENSEA: https://testnets.opensea.io/get-listed/step-two

contract YourCollectible is ERC721, VRFConsumerBase {

  bytes32 internal keyHash;
  uint256 internal fee;

  uint256 public randomResult;

  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  constructor(bytes32[] memory assetsForSale) public
    VRFConsumerBase(
      0x8C7382F9D8f56b33781fE506E897a4F1e2d17255, // VRF Coordinator on Mumbai
      0x326C977E6efc84E512bB9C30f76E30c160eD06FB  // LINK Token o Mumbai
    )  ERC721("YourCollectible", "YCB") {
    _setBaseURI("https://ipfs.io/ipfs/");
    for(uint256 i=0;i<assetsForSale.length;i++){
      forSale[assetsForSale[i]] = true;
    }
    keyHash = 0x6e75b569a01ef56d18cab6a8e71e6600d6ce853834d4a5748b720d06f878b3a4;
    fee = 0.0001 * 10 ** 18; // 0.0001 LINK
  }

  //this marks an item in IPFS as "forsale"
  mapping (bytes32 => bool) public forSale;
  //this lets you look up a token by the uri (assuming there is only one of each uri for now)
  mapping (bytes32 => uint256) public uriToTokenId;


  //strong NFTs
  mapping (bytes32 => uint8) public tokenStrength;


  function getRandomNumber(uint256 userProvidedSeed) public returns (bytes32 requestId) {
      require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK - fill contract with faucet");
      return requestRandomness(keyHash, fee, userProvidedSeed);
  }

  function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
      randomResult = randomness;
    }


  function mintItem(string memory tokenURI)
      public
      returns (uint256)
  {
      bytes32 uriHash = keccak256(abi.encodePacked(tokenURI));

      //make sure they are only minting something that is marked "forsale"
      require(forSale[uriHash],"NOT FOR SALE");
      forSale[uriHash]=false;

      tokenStrength[uriHash] = uint8( (randomResult % 100)+1 );
      randomResult=0;

      _tokenIds.increment();

      uint256 id = _tokenIds.current();
      _mint(msg.sender, id);
      _setTokenURI(id, tokenURI);

      uriToTokenId[uriHash] = id;

      return id;
  }
}
