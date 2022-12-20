const { ethers } = require("hardhat");


module.exports = async function(hre) {
    const {getNamedAccounts, deployments} = hre;
    const {deploy, log, get} = deployments;
    const {deployer} = await getNamedAccounts();

    log("Deploying box...");
    const box = await deploy("Box", {
        from: deployer,
        args: [],
        log: true
    });
    log("Box deployed");

    const timeLock = await ethers.getContract("TimeLock");
    const boxContract = await ethers.getContract("Box");
    const transferOwnerTx = await boxContract.transferOwnership(
        timeLock.address
    );
    await transferOwnerTx.wait(1);
    log("YOU DONE IT!!!")

}