async function swapToken(account, wethTokenAddress, daiAddress, amount) {
    const swapRouter = await ethers.getContractAt("ISwapRouter", "0xE592427A0AEce92De3Edee1F18E0157C05861564", account);
    const approveTx = await approveErc20(wethTokenAddress, "0xE592427A0AEce92De3Edee1F18E0157C05861564", amount, account);
    console.log(approveTx);
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
    try {
        await swapRouter.exactInputSingle(params, {gasLimit: ethers.utils.hexlify(1000000)});
    }
    catch (error) {
        console.error(error);
    }
    //await swapTx.wait(1);
    console.log("Swap made")
}




    console.log(`Pending debt is ${totalDebtETH}`);
    // swap to pay interest (swapRouter, Pool)
    await swapToken(deployer, wethTokenAddress, daiAddress, totalDebtETH);