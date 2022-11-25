const { network } = require("hardhat");
const {developmentChains, INITIAL_SUPPLY} = require("../helper-hardhat-config")
const { verify } = require("../helper-functions");

//getNamedAccounts: () => Promise<{ [name: string]: string }>: a function returning an object whose keys are names and values are addresses. It is parsed from the namedAccounts configuration (see Configuration).
// deployments: contains functions to access past deployments or to save new ones, as well as helpers functions.

module.exports = async function(hre) {
    const { getNamedAccounts, deployments } = hre;
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();
    const ourToken = await deploy("OurToken", {
        from: deployer,
        args: [INITIAL_SUPPLY],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`ourToken deployed at ${ourToken.address}`);
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        await verify(ourToken.address, [INITIAL_SUPPLY]);
    }
}


module.exports.tags = ["all", "token"];