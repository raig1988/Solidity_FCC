const {developmentChains, BASE_FEE, GAS_PRICE_LINK, DECIMALS, INITIAL_PRICE} = require("../helper-hardhat-config");

module.exports = async function() {
    const {getNamedAccounts, deployments} = hre;
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();

    if(developmentChains.includes(network.name)) {
        log("Local network detected, deploying mocks!...");
        await deploy("VRFCoordinatorV2Mock", {
            contract: "VRFCoordinatorV2Mock",
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK]
        });
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_PRICE]
        })

        log("Mocks deployed...");
        log("------------------------------------------");
    }
}

module.exports.tags = ["all", "mocks"]