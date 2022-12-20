const { ethers, network } = require("hardhat");
const { NEW_STORE_VALUE, FUNCT, PROPOSAL_DESCRIPTION, developmentChains, MIN_DELAY } = require("../helper-hardhat-config");
const { moveBlocks } = require("../utils/move-blocks");
const {moveTime} = require("../utils/move-time");


async function queueAndExecute() {
    const args = [NEW_STORE_VALUE];
    const box = await ethers.getContract("Box");
    const encodedFunctionCall = box.interface.encodeFunctionData(FUNCT, args);
    const descriptionHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(PROPOSAL_DESCRIPTION));
    const governor = await ethers.getContract("GovernorContract");
    console.log("Queueing...");
    const queueTx = await governor.queue([box.address],[0], [encodedFunctionCall], descriptionHash);
    await queueTx.wait(1);

    if (developmentChains.includes(network.name)) {
        await moveTime(MIN_DELAY + 1);
        await moveBlocks(1)
    }

    console.log("Executing...");
    const executeTx = await governor.execute(
        [box.address],
        [0],
        [encodedFunctionCall],
        descriptionHash
    );
    await executeTx.wait(1);

    const boxNewValue = await box.retrieve();
    console.log(`New Box Value: ${boxNewValue.toString()}`);

}

queueAndExecute()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })