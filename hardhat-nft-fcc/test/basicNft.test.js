const { assert } = require("chai");
const { getNamedAccounts, ethers } = require("hardhat");
const {developmentChains, networkConfig} = require("../helper-hardhat-config");

!developmentChains.includes(network.name) 
    ? describe.skip
    : describe("Basic Nft", function() {
        let deployer, basicNft, accounts;
        beforeEach(async function() {
            accounts = await ethers.getSigners()
            deployer = accounts[0];
            await deployments.fixture(["basicnft"]);
            const BasicNft = await ethers.getContractFactory("BasicNFT");
            basicNft = await BasicNft.deploy();
        })

        describe("constructor", function() {
            it("Initializes NFT correctly", async function() {
                const name = await basicNft.name();
                const symbol = await basicNft.symbol();
                const tokenCounter = await basicNft.getTokenCounter();
                assert.equal(name, "Dogie");
                assert.equal(symbol, "DOG");
                assert.equal(tokenCounter.toString(), 0);
            })
        })

        describe("Mint a NFT", function() {
            beforeEach(async function() {
                const tx = await basicNft.mintNft();
                await tx.wait();
            })

            it("Allows users to mint an NFT, and updates appropriately", async function() {
                const tokenURI = await basicNft.tokenURI(0);
                const tokenCounter = await basicNft.getTokenCounter();
                assert.equal(tokenCounter.toString(), 1);
                assert.equal(tokenURI, await basicNft.TOKEN_URI());
            })

            it("Show the correct balance and owner of an NFT", async function () {
                const deployerAddress = deployer.address;
                const deployerBalance = await basicNft.balanceOf(deployerAddress)
                const owner = await basicNft.ownerOf("0")
  
                assert.equal(deployerBalance.toString(), "1")
                assert.equal(owner, deployerAddress)
            })
        })
    })