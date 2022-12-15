const { assert, expect } = require("chai");
const {ethers, network, deployments} = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config");

// tests to do: manipulating price of mock aggregator, check for long strings...
const lowSVGImageUri =
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pgo8c3ZnIHdpZHRoPSIxMDI0cHgiIGhlaWdodD0iMTAyNHB4IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGZpbGw9IiMzMzMiIGQ9Ik01MTIgNjRDMjY0LjYgNjQgNjQgMjY0LjYgNjQgNTEyczIwMC42IDQ0OCA0NDggNDQ4IDQ0OC0yMDAuNiA0NDgtNDQ4Uzc1OS40IDY0IDUxMiA2NHptMCA4MjBjLTIwNS40IDAtMzcyLTE2Ni42LTM3Mi0zNzJzMTY2LjYtMzcyIDM3Mi0zNzIgMzcyIDE2Ni42IDM3MiAzNzItMTY2LjYgMzcyLTM3MiAzNzJ6Ii8+CiAgPHBhdGggZmlsbD0iI0U2RTZFNiIgZD0iTTUxMiAxNDBjLTIwNS40IDAtMzcyIDE2Ni42LTM3MiAzNzJzMTY2LjYgMzcyIDM3MiAzNzIgMzcyLTE2Ni42IDM3Mi0zNzItMTY2LjYtMzcyLTM3Mi0zNzJ6TTI4OCA0MjFhNDguMDEgNDguMDEgMCAwIDEgOTYgMCA0OC4wMSA0OC4wMSAwIDAgMS05NiAwem0zNzYgMjcyaC00OC4xYy00LjIgMC03LjgtMy4yLTguMS03LjRDNjA0IDYzNi4xIDU2Mi41IDU5NyA1MTIgNTk3cy05Mi4xIDM5LjEtOTUuOCA4OC42Yy0uMyA0LjItMy45IDcuNC04LjEgNy40SDM2MGE4IDggMCAwIDEtOC04LjRjNC40LTg0LjMgNzQuNS0xNTEuNiAxNjAtMTUxLjZzMTU1LjYgNjcuMyAxNjAgMTUxLjZhOCA4IDAgMCAxLTggOC40em0yNC0yMjRhNDguMDEgNDguMDEgMCAwIDEgMC05NiA0OC4wMSA0OC4wMSAwIDAgMSAwIDk2eiIvPgogIDxwYXRoIGZpbGw9IiMzMzMiIGQ9Ik0yODggNDIxYTQ4IDQ4IDAgMSAwIDk2IDAgNDggNDggMCAxIDAtOTYgMHptMjI0IDExMmMtODUuNSAwLTE1NS42IDY3LjMtMTYwIDE1MS42YTggOCAwIDAgMCA4IDguNGg0OC4xYzQuMiAwIDcuOC0zLjIgOC4xLTcuNCAzLjctNDkuNSA0NS4zLTg4LjYgOTUuOC04OC42czkyIDM5LjEgOTUuOCA4OC42Yy4zIDQuMiAzLjkgNy40IDguMSA3LjRINjY0YTggOCAwIDAgMCA4LTguNEM2NjcuNiA2MDAuMyA1OTcuNSA1MzMgNTEyIDUzM3ptMTI4LTExMmE0OCA0OCAwIDEgMCA5NiAwIDQ4IDQ4IDAgMSAwLTk2IDB6Ii8+Cjwvc3ZnPgo="
const highSVGImageUri =
    "data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgd2lkdGg9IjQwMCIgIGhlaWdodD0iNDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgZmlsbD0ieWVsbG93IiByPSI3OCIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIzIi8+CiAgPGcgY2xhc3M9ImV5ZXMiPgogICAgPGNpcmNsZSBjeD0iNjEiIGN5PSI4MiIgcj0iMTIiLz4KICAgIDxjaXJjbGUgY3g9IjEyNyIgY3k9IjgyIiByPSIxMiIvPgogIDwvZz4KICA8cGF0aCBkPSJtMTM2LjgxIDExNi41M2MuNjkgMjYuMTctNjQuMTEgNDItODEuNTItLjczIiBzdHlsZT0iZmlsbDpub25lOyBzdHJva2U6IGJsYWNrOyBzdHJva2Utd2lkdGg6IDM7Ii8+Cjwvc3ZnPg=="
const highTokenUri =
    "data:application/json;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgd2lkdGg9IjQwMCIgIGhlaWdodD0iNDAwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgZmlsbD0ieWVsbG93IiByPSI3OCIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIzIi8+CiAgPGcgY2xhc3M9ImV5ZXMiPgogICAgPGNpcmNsZSBjeD0iNjEiIGN5PSI4MiIgcj0iMTIiLz4KICAgIDxjaXJjbGUgY3g9IjEyNyIgY3k9IjgyIiByPSIxMiIvPgogIDwvZz4KICA8cGF0aCBkPSJtMTM2LjgxIDExNi41M2MuNjkgMjYuMTctNjQuMTEgNDItODEuNTItLjczIiBzdHlsZT0iZmlsbDpub25lOyBzdHJva2U6IGJsYWNrOyBzdHJva2Utd2lkdGg6IDM7Ii8+Cjwvc3ZnPg=="
const lowTokenUri =
    "data:application/json;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBzdGFuZGFsb25lPSJubyI/Pgo8c3ZnIHdpZHRoPSIxMDI0cHgiIGhlaWdodD0iMTAyNHB4IiB2aWV3Qm94PSIwIDAgMTAyNCAxMDI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgogIDxwYXRoIGZpbGw9IiMzMzMiIGQ9Ik01MTIgNjRDMjY0LjYgNjQgNjQgMjY0LjYgNjQgNTEyczIwMC42IDQ0OCA0NDggNDQ4IDQ0OC0yMDAuNiA0NDgtNDQ4Uzc1OS40IDY0IDUxMiA2NHptMCA4MjBjLTIwNS40IDAtMzcyLTE2Ni42LTM3Mi0zNzJzMTY2LjYtMzcyIDM3Mi0zNzIgMzcyIDE2Ni42IDM3MiAzNzItMTY2LjYgMzcyLTM3MiAzNzJ6Ii8+CiAgPHBhdGggZmlsbD0iI0U2RTZFNiIgZD0iTTUxMiAxNDBjLTIwNS40IDAtMzcyIDE2Ni42LTM3MiAzNzJzMTY2LjYgMzcyIDM3MiAzNzIgMzcyLTE2Ni42IDM3Mi0zNzItMTY2LjYtMzcyLTM3Mi0zNzJ6TTI4OCA0MjFhNDguMDEgNDguMDEgMCAwIDEgOTYgMCA0OC4wMSA0OC4wMSAwIDAgMS05NiAwem0zNzYgMjcyaC00OC4xYy00LjIgMC03LjgtMy4yLTguMS03LjRDNjA0IDYzNi4xIDU2Mi41IDU5NyA1MTIgNTk3cy05Mi4xIDM5LjEtOTUuOCA4OC42Yy0uMyA0LjItMy45IDcuNC04LjEgNy40SDM2MGE4IDggMCAwIDEtOC04LjRjNC40LTg0LjMgNzQuNS0xNTEuNiAxNjAtMTUxLjZzMTU1LjYgNjcuMyAxNjAgMTUxLjZhOCA4IDAgMCAxLTggOC40em0yNC0yMjRhNDguMDEgNDguMDEgMCAwIDEgMC05NiA0OC4wMSA0OC4wMSAwIDAgMSAwIDk2eiIvPgogIDxwYXRoIGZpbGw9IiMzMzMiIGQ9Ik0yODggNDIxYTQ4IDQ4IDAgMSAwIDk2IDAgNDggNDggMCAxIDAtOTYgMHptMjI0IDExMmMtODUuNSAwLTE1NS42IDY3LjMtMTYwIDE1MS42YTggOCAwIDAgMCA4IDguNGg0OC4xYzQuMiAwIDcuOC0zLjIgOC4xLTcuNCAzLjctNDkuNSA0NS4zLTg4LjYgOTUuOC04OC42czkyIDM5LjEgOTUuOCA4OC42Yy4zIDQuMiAzLjkgNy40IDguMSA3LjRINjY0YTggOCAwIDAgMCA4LTguNEM2NjcuNiA2MDAuMyA1OTcuNSA1MzMgNTEyIDUzM3ptMTI4LTExMmE0OCA0OCAwIDEgMCA5NiAwIDQ4IDQ4IDAgMSAwLTk2IDB6Ii8+Cjwvc3ZnPgo="


!developmentChains.includes(network.name) ?
    describe.skip :
    describe("Dynamic Svg Nft", function() {
        let deployer, accounts, dynamicSvgNft, mockV3Aggregator;
        beforeEach(async function() {
            accounts = await ethers.getSigners();
            deployer = accounts[0];
            await deployments.fixture(["mocks","dynamicsvg"]);
            dynamicSvgNft = await ethers.getContract("DynamicSvgNft");
            mockV3Aggregator = await ethers.getContract("MockV3Aggregator");
        });
        describe("constructor", function() {
            it("check for constructor values correctly", async function() {
                const priceFeed = await dynamicSvgNft.getPriceFeed();
                const lowSVG = await dynamicSvgNft.getLowImageURI();
                const highSGV = await dynamicSvgNft.getHighImageURI();
                assert.equal(priceFeed, mockV3Aggregator.address);
                assert.equal(lowSVG, lowSVGImageUri);
                assert.equal(highSGV, highSVGImageUri);
            })
        })
        describe("MintNft", function() {
            it("emits and event and creates the nft", async function() {
                const highValue = ethers.utils.parseEther("1"); // 1 dollar per ether
                await expect(dynamicSvgNft.mintNft(highValue)).to.emit(dynamicSvgNft, "CreatedNft");
                const tokenCounter = await dynamicSvgNft.getTokenCounter();
                assert.equal(tokenCounter, 1);
                // const tokenUri = await dynamicSvgNft.tokenURI(1);
                // assert.equal(tokenUri, highTokenUri);
            })
            it("shifts the token uri to lower when the price doesn't surpass the highvalue", async function() {
                // const highValue = ethers.utils.parseEther("100000000") // $100,000,000 dollar per ether. Maybe in the distant future this test will fail...
                // const txResponse = await dynamicSvgNft.mintNft(highValue)
                // await txResponse.wait(1)
                // const tokenURI = await dynamicSvgNft.tokenURI(0)
                // assert.equal(tokenURI, lowTokenUri)
            })
        })
    })