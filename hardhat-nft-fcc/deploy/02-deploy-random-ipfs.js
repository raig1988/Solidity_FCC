const {network, ethers} = require("hardhat");
const {developmentChains, networkConfig} = require("../helper-hardhat-config");
const {verify} = require("../utils/verify");
const {storeImages, storeTokenUriMetadata} = require("../utils/uploadToPinata");

let tokenUris = [
    'ipfs://QmaVkBn2tKmjbhphU7eyztbvSQU5EXDdqRyXZtRhSGgJGo',
    'ipfs://QmYQC5aGZu2PTH8XzbJrbDnvhj3gVs7ya33H9mqUNvST3d',
    'ipfs://QmZYmH5iDbD6v3U2ixoVAjioSzvWJszDzYdbeCLquGSpVm'
  ]
const FUND_AMOUNT = "1000000000000000000000";
const imagesLocation = "./images/randomNft";
const metadataTemplate = {
    name: "",
    description: "",
    image: "",
    attributes: [
        {
            trait_type: "Cuteness",
            value: 100,
        }
    ]
}

module.exports = async function(hre) {
    const {getNamedAccounts, deployments} = hre;
    const { deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId;
    tokenUris;
    // get IPFS hashes of our images
    if (process.env.UPLOAD_TO_PINATA == "true") {
        tokenUris = await handleTokenUris();
    }

    // 1. With our own IPFS node. programmaticaly through the documentation https://docs.ipfs.io
    // 2. Pinata https://www.pinata.cloud
    // 3. NFT.storage https://nft.storage

    let vrfCoordinatorV2Address, subscriptionId, vrfCoordinatorV2Mock;

    if(developmentChains.includes(network.name)) {
        vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
        vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
        // get subscriptionId
        const tx = await vrfCoordinatorV2Mock.createSubscription();
        const txReceipt = await tx.wait(1);
        subscriptionId = txReceipt.events[0].args.subId;
        // Our mock makes it so we don't actually have to worry about sending fund
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
    } else {
        vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2;
        subscriptionId = networkConfig[chainId].subscriptionId;
    }
    log("-----------------------------------------");

    const args = [
        vrfCoordinatorV2Address, 
        subscriptionId, 
        networkConfig[chainId]["gasLane"], 
        networkConfig[chainId]["callbackGasLimit"], 
        tokenUris, 
        networkConfig[chainId]["mintFee"],
    ];

    const randomIpfsNft = await deploy("RandomIpfsNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });

    if (chainId == 31337) {
        await vrfCoordinatorV2Mock.addConsumer(subscriptionId, randomIpfsNft.address)
    };

    log("------------------------------------------------");

    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying...");
        await verify(randomIpfsNft.address, args);
    }
}

async function handleTokenUris() {
    tokenUris = [];
    // store the image in IPFS
    // store metadata in IPFS
    const {responses: imageUploadResponses, files} = await storeImages(imagesLocation);
    for (imageUploadResponseIndex in imageUploadResponses) {
        // create metadata
        // upload metadata
        let tokenUriMetadata = {...metadataTemplate};
        tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "");
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`;
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`;
        console.log(`Uploading ${tokenUriMetadata.name}...`);
        // store the json to pinata / ipfs
        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata);
        tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
    }
    console.log("Token URIs uploaded! They are: ");
    console.log(tokenUris);
    return tokenUris;
}

module.exports.tags = ["all", "randomipfs", "main"];