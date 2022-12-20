const {ethers, network} = require("hardhat");

module.exports = async function(hre) {
    const {deployments, getNamedAccounts} = hre;
    const {deploy, log} = deployments;
    const {deployer} = await getNamedAccounts();

    console.log("Deploying Governance Token...");
    const governanceToken = await deploy("GovernanceToken", {
        from: deployer,
        args: [],
        log: true,
        //waitConfirmations: 1
    });
    console.log(`Deployed Governance Token to ${governanceToken.address}`);

    await delegate(governanceToken.address, deployer);
    console.log("Delegated!")
}

const delegate = async function(governanceTokenAddress, delegatedAccount) {
    const governanceToken = await ethers.getContractAt("GovernanceToken", governanceTokenAddress);
    const tx = await governanceToken.delegate(delegatedAccount);
    await tx.wait(1);
    console.log(`Checkpoints ${await governanceToken.numCheckpoints(delegatedAccount)}`);
}