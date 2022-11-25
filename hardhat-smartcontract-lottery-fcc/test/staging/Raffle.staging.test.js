const {assert, expect } = require("chai");
const {getNamedAccounts, network, deployments, ethers} = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

developmentChains.includes(network.name) 
    ? describe.skip 
    : describe("Raffle Staging Tests", function() {
        let raffle, raffleEntranceFee, deployer;

        beforeEach(async function() {
            deployer = (await getNamedAccounts()).deployer;
            raffle = await ethers.getContract("Raffle", deployer);
            raffleEntranceFee = await raffle.getEntranceFee();
            // // solution to solve "doesnt allow entrance when.. is calculating" 
            // const suscriptionId = raffle.getSubscriptionId();
            // await vrfCoordinatorV2Mock.addConsumer(suscriptionId, raffle.address);
        })

        describe("fulfillRandomWords", function() {
            it("works with live Chainlink keepers and Chainlink VRF, we get a random winner", async function() {
                // enter the raffle
                console.log("Setting up test...");
                const startingTimeStamp = await raffle.getLatestTimeStamp();
                const accounts = await ethers.getSigners();
                // setup a listener before we enter the raffle 
                // just in case the blockchain moves REALLY fast
                console.log("Setting up Listener...");
                await new Promise(async function(resolve, reject) {
                    raffle.once("WinnerPicked", async function() {
                        console.log("WinnerPicked event Fired!");
                        try {
                            async () => {
                                // add our asserts here
                                const recentWinner = await raffle.getRecentWinner();
                                const raffleState = await raffle.getRaffleState();
                                const winnerEndingBalance = await accounts[0].getBalance();
                                const endingTimeStamp = await raffle.getLatestTimeStamp();
                                await expect(raffle.getPlayer(0)).to.be.reverted; // check no players
                                assert.equal(recentWinner.toString(), accounts[0].address);
                                assert.equal(raffleState, 0);
                                assert.equal(winnerEndingBalance.toString(), winnerStartingBalance.add(raffleEntranceFee).toString());
                                assert(endingTimeStamp > startingTimeStamp);
                                resolve();
                            }
                        } catch(error) {
                            console.log(error);
                            reject(error);
                        }
                    })
                    // then enter the raffle
                    // get account starting balance
                    const winnerStartingBalance = await accounts[0].getBalance();
                    console.log("Entering Raffle...");
                    const transactionResponse = await raffle.enterRaffle({ value: raffleEntranceFee});
                    await transactionResponse.wait(1);
                    console.log("Ok, time to wait...");
                    // this code wont complete until our listener has finished listening!
                })
            })
        })

    })

    // 1. Get our SubId for ChainLink VRF // ID 6131
    // 2. Deploy our contract using the SubId // set in "helpers-hardhat-config" suscriptionId: "6131",
    // 3. Register the contract with Chainlink VRF & its subId // contract 0x3771ff9a56a231ea26faf2905b80a898139b0116 added as consumer
    // 4. Register the contract with Chainlink Keepers // contract registered with custom logic
    // 5. Run staging tests