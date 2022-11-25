const {ethers } = require("hardhat");

async function enterRaffle() {
    console.log("Executing function...")
    const raffle = await ethers.getContract("Raffle");
    const entranceFee = await raffle.getEntranceFee();
    const transactionResponse = await raffle.enterRaffle({ value: entranceFee + 1});
    console.log("Entered!")
}

enterRaffle()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })