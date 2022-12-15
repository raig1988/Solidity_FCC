const { getNamedAccounts, ethers } = require("hardhat");
const { getWeth, AMOUNT } = require("../scripts/getWeth");

async function main() {
    // the protocol treats everything as an ERC20 token
    await getWeth();
    const { deployer } = await getNamedAccounts();
    // abi, address
    // Lending pool Addresses Provider: 0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
    // Lending Pool
    const lendingPool = await getLendingPool(deployer);
    console.log(`LendingPool address ${lendingPool.address}`);

    // deposit
    const wethTokenAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    await approveErc20(wethTokenAddress, lendingPool.address, AMOUNT, deployer);
    console.log("Depositing...");
    await lendingPool.deposit(wethTokenAddress, AMOUNT, deployer, 0);
    console.log("Deposited!");  
    let {availableBorrowsETH } = await getBorrowUserData(lendingPool, deployer);

    // availableBorrowsEth ?? What the conversion rate of DAI is?
    const daiPrice = await getDai();
    const amountDaiToBorrow = availableBorrowsETH.toString() * 0.95 * (1 / daiPrice.toNumber()); // get 95% of max you can borrow
    console.log(`You can borrow ${amountDaiToBorrow} DAI`);
    const amountDaiToBorrowWei = ethers.utils.parseEther(amountDaiToBorrow.toString());

    // Borrow
    // how much we have borrowed, how much we have in collateral, how much we can borrow
    const daiAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
    await borrowDai(daiAddress, lendingPool, amountDaiToBorrowWei, deployer);
    await getBorrowUserData(lendingPool, deployer);
    // Repay
    await repay(amountDaiToBorrowWei, daiAddress, lendingPool, deployer);
    // identify pending debt
    let { totalDebtETH } = await getBorrowUserData(lendingPool, deployer);
    console.log(`Pending debt is ${totalDebtETH}`);
    // swap to pay interest (swapRouter, Pool)
    await getWeth(); // get Weth to swap for DAI
    await swapToken(deployer, wethTokenAddress, daiAddress, totalDebtETH);
    // repay debt
    const daiPrice2 = await getDai();
    const amountDaiInDebt = totalDebtETH.toString() * (1 / daiPrice2.toNumber());
    const amountDaiInDebtWei = ethers.utils.parseEther(amountDaiInDebt.toString());
    console.log(`Debt in DAI is ${amountDaiInDebtWei}`);
    console.log("Paying debt...");
    await repay(amountDaiInDebtWei, daiAddress, lendingPool, deployer);
    console.log("Debt paid!");
    console.log("Final stats:")
    await getBorrowUserData(lendingPool, deployer);

}

async function swapToken(account, wethTokenAddress, daiAddress, amount) {
    const swapRouter = await ethers.getContractAt("ISwapRouter", "0xE592427A0AEce92De3Edee1F18E0157C05861564", account);
    await approveErc20(wethTokenAddress, swapRouter.address, amount, account);
    // get params
    const params = {
        tokenIn: wethTokenAddress,
        tokenOut: daiAddress,
        fee: "500",
        recipient: account,
        deadline: Math.floor(Date.now() / 1000) + (60 * 10),
        amountIn: amount,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
    }
    console.log("Making swap...")
    const swapTx = await swapRouter.exactInputSingle(params);
    await swapTx.wait(1);
    console.log("Swap made")
}

async function repay(amount, daiAddress, lendingPool, account) {
    await approveErc20(daiAddress, lendingPool.address, amount, account);
    const repayTx = await lendingPool.repay(daiAddress, amount, 1, account);
    await repayTx.wait(1);
    console.log("Repaid!")
}

async function borrowDai(daiAddress, lendingPool, amountDaiToBorrowWei, account) {
    const borrowTx = await lendingPool.borrow(daiAddress, amountDaiToBorrowWei, 1, 0, account);
    await borrowTx.wait(1);
    console.log("You've borrowed!");
} 

async function getDai() {
    const daiEthPriceFeed = await ethers.getContractAt(
        "AggregatorV3Interface", 
        "0x773616E4d11A78F511299002da57A0a94577F1f4"
        );
    const price = (await daiEthPriceFeed.latestRoundData())[1];
    console.log(`The DAI/ETH price is ${price.toString()}`);
    return price;
}

async function getBorrowUserData(lendingPool, account) {
    const { totalCollateralETH, totalDebtETH, availableBorrowsETH } = await lendingPool.getUserAccountData(account);
    console.log(`You have ${totalCollateralETH} worth of ETH deposited`);
    console.log(`You have ${totalDebtETH} worth of ETH borrowed`);
    console.log(`You can borrow ${availableBorrowsETH} worth of ETH`);
    return {availableBorrowsETH, totalDebtETH};
}

async function getLendingPool(account) {
    const lendingPoolAddressesProvider = await ethers.getContractAt(
        "ILendingPoolAddressesProvider", 
        "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5", 
        account
        );
    const lendingPoolAddress = await lendingPoolAddressesProvider.getLendingPool();
    const lendingPool = await ethers.getContractAt(
        "ILendingPool", 
        lendingPoolAddress, 
        account
        );
    return lendingPool;
}

async function approveErc20(erc20Address, spenderAddress, amountToSpend, account) {
    const erc20Token = await ethers.getContractAt(
        "IERC20", 
        erc20Address, 
        account
        );
    const tx = await erc20Token.approve(spenderAddress, amountToSpend);
    await tx.wait(1);
    console.log("Approved!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })