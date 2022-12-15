const networkConfig = {
    5: {
        name: "goerli",
        ethUsdPriceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        suscriptionId: "6131",
        callbackGasLimit:"100000",
        mintFee: "10000000000000000", // 0.01 ETH
    },
    31337: {
        name: "localhost",
        ethUsdPriceFeed: "0x9326BFA02ADD2366b30bacB125260Af641031331",
        gasLane: "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        callbackGasLimit:"100000",
        mintFee: "10000000000000000", // 0.01 ETH
    },
}

const DECIMALS = "18"
const INITIAL_PRICE = "200000000000000000000"
const BASE_FEE = ethers.utils.parseEther("0.25"); // 0.25 is the premium, it costs 0.25 LINK per request
const GAS_PRICE_LINK = 1e9; // 1+000000000

const developmentChains = ["hardhat", "localhost"];

module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_PRICE,
    BASE_FEE,
    GAS_PRICE_LINK
}