const {networkConfig, developmentChains} = require("../helper-hardhat-config")
const {network} = require("hardhat")
const {verify} = require("../utils/verify")
// using brackets is same as:
// const helperConfig = require("../helper-hardhat-config")
// const networkConfig = helperConfig.networkConfig

// option 1
// function deployFunc() {
//     console.log("Hi!")
// }
// module.exports.default = deployFunc
// option 2
// module.exports = async (hre) => {
//     const { getNamedAccounts, deployments } = hre
// }
// option 3
//module.exports = async ({ getNamedAccounts, deployments}) => {}
// ill go with option 2
module.exports = async (hre) => {
    const { getNamedAccounts, deployments} = hre;
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId;

    // if chainId is X use address Y
    // if chainId is Z use address A
    //
    let ethUsdPriceFeedAddress
    if(developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    // if the contract doesnt exist, we deploy a minimal version of it for our local testing

    // well what happens when we want to change chains?
    // when going for localhost or hardhat network we want to use a mock
    const args = [ethUsdPriceFeedAddress]
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    if(!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(fundMe.address, args)
    }
    log("--------------------------------------------------------------------------------")
}

module.exports.tags = ["all", "fundme"]