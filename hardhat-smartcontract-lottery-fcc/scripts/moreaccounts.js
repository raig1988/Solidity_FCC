const { ethers } = require("hardhat");

const numberOfParticipants = 10;

async function moreParticipants() {
    // more than 1 account
    const accounts = await ethers.getSigners();
    console.log(accounts);
    // access contract functions
    const raffle = await ethers.getContract("Raffle");
    // get entrance Fee
    const entranceFee = await raffle.getEntranceFee();
    // log varios accounts into the raffle except deployer
    for (let i = 1; i < numberOfParticipants; i++) {
        const raffleParticipants = raffle.connect(accounts[i]);
        await raffleParticipants.enterRaffle({value: entranceFee});
    }
}


moreParticipants()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
