const fs = require("fs");
const { proposalsFile, developmentChains, VOTING_PERIOD } = require("../helper-hardhat-config");
const {network, ethers} = require("hardhat");
const { moveBlocks } = require("../utils/move-blocks");

const index = 0;

async function main(proposalIndex) {
    const proposals = JSON.parse(fs.readFileSync(proposalsFile), "utf8");
    const proposalId = proposals[network.config.chainId][proposalIndex];
    // 0 : against , 1: for, 2: abstain
    const reason = "I like a do da cha cha";
    const voteWay = 1;
    const governor = await ethers.getContract("GovernorContract");
    const voteTxResponse = await governor.castVoteWithReason(proposalId, voteWay, reason);
    await voteTxResponse.wait(1);

    if(developmentChains.includes(network.name)) {
        await moveBlocks(VOTING_PERIOD + 1);
    }
    console.log("Voted! Ready to go!");
    const voteState = await governor.state(proposalId);
    console.log(`vote state is ${voteState}`);
    
}

main(index)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })