const { ethers } = require("hardhat");
const { ADDRESS_ZER0 } = require("../helper-hardhat-config");


module.exports = async function(hre) {
    const {getNamedAccounts, deployments} = hre;
    const {deploy, log, get} = deployments;
    const {deployer} = await getNamedAccounts();
    // get contract only works once the contracts have been deployed first
    const timeLock = await ethers.getContract("TimeLock", deployer);
    const governor = await ethers.getContract("GovernorContract", deployer);

    log("Setting up roles...");
    const proposerRole = await timeLock.PROPOSER_ROLE();
    const executorRole = await timeLock.EXECUTOR_ROLE();
    const adminRole = await timeLock.TIMELOCK_ADMIN_ROLE();
    
    const proposerTx = await timeLock.grantRole(proposerRole, governor.address);
    await proposerTx.wait(1);
    const executorTx = await timeLock.grantRole(executorRole, ADDRESS_ZER0);
    await executorTx.wait(1);
    const revokeTx = await timeLock.revokeRole(adminRole, deployer);
    await revokeTx.wait(1);
    log("Roles set!")
}

