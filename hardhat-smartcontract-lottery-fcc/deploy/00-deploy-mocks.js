const { developmentChains, BASE_FEE, GAS_PRICE_LINK} = require("../helper-hardhat-config");

module.exports = async function(hre) {
    //console.log(hre.deployments);
    const {getNamedAccounts, deployments} = hre;
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();
    const chainId = network.config.chainId;

    if(developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...");
        // deploy a mock vrf coordinator...
        await deploy("VRFCoordinatorV2Mock", {
            contract: "VRFCoordinatorV2Mock",
            from: deployer,
            log: true,
            args: [BASE_FEE, GAS_PRICE_LINK]
        })
        log("Mocks deployed!");
        log("------------------------")
    }
}

module.exports.tags = ["all", "mocks"]
