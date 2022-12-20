const { ethers } = require("hardhat");
const { VOTING_DELAY, VOTING_PERIOD, QUORUM_PERCENTAGE } = require("../helper-hardhat-config");


module.exports = async function(hre) {
    const {getNamedAccounts, deployments} = hre;
    const {deploy, log, get} = deployments;
    const {deployer} = await getNamedAccounts();
    const governanceToken = await get("GovernanceToken");
    const timeLock = await get("TimeLock");

    log("Deploying Governor Contract...");
    const governorContract = await deploy("GovernorContract", {
        from: deployer,
        args: [
            governanceToken.address,
            timeLock.address,
            VOTING_DELAY,
            VOTING_PERIOD,
            QUORUM_PERCENTAGE
        ],
        log: true
    });
    log("Deployed!");
}