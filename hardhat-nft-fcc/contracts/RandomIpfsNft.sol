// SPDX-License-Identifier: MIT

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

pragma solidity ^0.8.17;

error RandomIpfsNft__AlreadyInitialized();
error RandomIpfsNft_RangeOutOfBounds();
error RandomIpfsNft_NeedMoreEthSent();
error RandomIpfsNft_TransferFailed();

contract RandomIpfsNft is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    // when we mint a NFT, we will trigger a Chainlink VRF call to get us a random number
    // using that number, we will get a random NFT
    // Pug, Shiba Inu, St Bernard
    // Pug Super Rare
    // Shiba sort of rare
    // St Bernanrd common

    // users have to pay to mint a NFT
    // the owner of the contract can withdraw the ETH

    // Type declaration
    enum Breed {
        PUG,
        SHIBA_INU,
        ST_BERNARD
    }

    VRFCoordinatorV2Interface private immutable i_vrfCoordinator; 
    uint64 private immutable i_subscriptionId;
    bytes32 private immutable i_gasLane;
    uint32 private immutable i_callbackGasLimit;
    uint16 private constant REQUEST_CONFIRMATIONS = 3;
    uint32 private constant NUM_WORDS = 1;

    // VRF helpers
    mapping(uint256 => address) public s_requestIdToSender;

    // NFT variables
    uint256 public s_tokenCounter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    string[] internal s_dogTokenUris;
    uint256 internal i_mintFee;
    bool private s_initialized;

    // Events
    event NftRequested(uint256 indexed requestId, address requester);
    event NftMinted(Breed dogBreed, address minter);

    constructor(
        address vrfCoordinatorV2, 
        uint64 suscriptionId, 
        bytes32 gasLane, 
        uint32 callbackGasLimit,
        string[3] memory dogTokenUris,
        uint256 mintFee
    ) VRFConsumerBaseV2(vrfCoordinatorV2) ERC721("Random IPFS NFT", "RIN") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinatorV2);
        i_subscriptionId = suscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = callbackGasLimit;
        _initializeContract(dogTokenUris);
        i_mintFee = mintFee;
    }

    function requestNft() public payable returns(uint256 requestId) {
        if(msg.value < i_mintFee) {
            revert RandomIpfsNft_NeedMoreEthSent();
        }
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUEST_CONFIRMATIONS,
            i_callbackGasLimit,
            NUM_WORDS
        );
        s_requestIdToSender[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) 
        internal 
        override 
    {
        address dogOwner = s_requestIdToSender[requestId];
        uint256 newTokenId = s_tokenCounter;
        // what does this token look like?
        uint256 moddedRng = randomWords[0] % MAX_CHANCE_VALUE;
        // 0 - 99
        // 7 -> PUG
        // 12 -> Shiba Inu
        // 45 -> St Bernard
        Breed dogBreed = getBreedFromModdedRng(moddedRng);
        s_tokenCounter += 1;
        _safeMint(dogOwner, newTokenId);
        _setTokenURI(newTokenId, s_dogTokenUris[uint256(dogBreed)]);
        emit NftMinted(dogBreed, dogOwner);
    }

    function withdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if(!success) { 
            revert RandomIpfsNft_TransferFailed();
        }
    }

    function getBreedFromModdedRng(uint256 moddedRng) public pure returns(Breed) {
        uint256 cumulativeSum = 0;
        uint256[3] memory chanceArray = getChanceArray();
        for(uint256 i = 0; i < chanceArray.length; i++) {
            if(moddedRng >= cumulativeSum && moddedRng < chanceArray[i]) {
                return Breed(i);
            }
            cumulativeSum = chanceArray[i];
        }
        revert RandomIpfsNft_RangeOutOfBounds();
    }

    function _initializeContract(string[3] memory dogTokenUris) private {
        if (s_initialized) {
            revert RandomIpfsNft__AlreadyInitialized();
        }
        s_dogTokenUris = dogTokenUris;
        s_initialized = true;
    }

    function getChanceArray() public pure returns(uint256[3] memory) {
        return[10, 30, MAX_CHANCE_VALUE];
    }

    function getMintFee() public view returns(uint256) {
        return i_mintFee;
    }

    function getDogTokenUris(uint256 index) public view returns(string memory) {
        return s_dogTokenUris[index];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getSuscriptionId() public view returns (uint64) {
        return i_subscriptionId;
    }

    function getInitialized() public view returns (bool) {
        return s_initialized;
    }
}