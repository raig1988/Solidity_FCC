const { getNamedAccounts, ethers } = require("hardhat");

const AMOUNT = ethers.utils.parseEther("0.02");
// 20000000000000000 / 18 decimals = 0.02

const getWeth = async function() {
    // deployer is the first account given by local hardhat
    const {deployer} = await getNamedAccounts();
    // call the deposit function on the weth contract
    // abi ✅, contract address ✅
    // weth 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
    const iWeth = await ethers.getContractAt("IWeth", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", deployer);
    const tx = await iWeth.deposit({ value: AMOUNT });
    await tx.wait(1);
    const wethBalance = await iWeth.balanceOf(deployer);
    console.log(`Address of deployer is ${deployer}`);
    console.log(`Got ${wethBalance.toString()} WETH`);

}

module.exports = { getWeth, AMOUNT };