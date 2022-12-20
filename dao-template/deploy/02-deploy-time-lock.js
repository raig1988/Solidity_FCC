const {MIN_DELAY} = require("../helper-hardhat-config");

module.exports = async function(hre) {
    const {getNamedAccounts, deployments} = hre;
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();

    log("Deploying TimeLock...");
    const timeLock = await deploy("TimeLock", {
        from: deployer,
        args: [MIN_DELAY, [], []],
        log: true,
    });
    log("Deployed!")

}