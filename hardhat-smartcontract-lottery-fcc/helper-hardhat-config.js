const { ethers } = require("hardhat");

const networkConfig = {
    5: {
        name: "goerli",
        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
        // adding arguments of the constructor
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        suscriptionId: "6131",
        callBackGasLimit:"500000",
        interval:"30",
    },
    31337: {
        name: "hardhat",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        callBackGasLimit:"500000",
        interval:"30",
    },
}

const developmentChains = ["hardhat", "localhost"];
const BASE_FEE = ethers.utils.parseEther("0.25"); // 0.25 is the premium, it costs 0.25 LINK per request
const GAS_PRICE_LINK = 1e9; // 1+000000000

// ETH PRICE 1 BILLION USD
// Chainlink nodes pay the gas fees to give us randomness & do external execution
// So they price of requests change based on the price of gas

module.exports = {
    networkConfig,
    developmentChains,
    BASE_FEE,
    GAS_PRICE_LINK,
}