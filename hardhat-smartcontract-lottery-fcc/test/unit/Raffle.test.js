const { assert, expect } = require("chai");
const { isBytes } = require("ethers/lib/utils");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const { HARDHAT_NETWORK_RESET_EVENT } = require("hardhat/internal/constants");
const {developmentChains, networkConfig} = require("../../helper-hardhat-config");

!developmentChains.includes(network.name) 
    ?   describe.skip 
    :   describe("Raffle", async function() {
        let raffle, deployer, vrfCoordinatorV2Mock, raffleEntranceFee, interval;
        const chainId = network.config.chainId;

        beforeEach(async function() {
            deployer = (await getNamedAccounts()).deployer;
            await deployments.fixture(["all"]);
            raffle = await ethers.getContract("Raffle", deployer);
            vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
            raffleEntranceFee = await raffle.getEntranceFee();
            interval = await raffle.getInterval();
            // solution to solve "doesnt allow entrance when.. is calculating" 
            const suscriptionId = raffle.getSubscriptionId();
            await vrfCoordinatorV2Mock.addConsumer(suscriptionId, raffle.address);
        })
        
        describe("constructor", function() {
            it("initializes the raffle correctly", async function() {
                // Ideally we make our tests have just 1 assert per "it"
                const raffleState = await raffle.getRaffleState();
                const interval = await raffle.getInterval();
                assert.equal(raffleState.toString(), "0");
                assert.equal(interval.toString(), networkConfig[chainId]["interval"]);
            })
        })

        describe("enterRaffle", function() {
            it("reverts when you dont pay enough", async function() {
                await expect(raffle.enterRaffle()).to.be.revertedWithCustomError(raffle, "Raffle__NotEnoughEthEntered");
            })

            it("records players when they enter", async function() {
                await raffle.enterRaffle({value: raffleEntranceFee});
                const playerFromContract = await raffle.getPlayer(0);
                assert.equal(playerFromContract, deployer);
            })

            it("emits event on enter", async function() {
                await expect(raffle.enterRaffle({value: raffleEntranceFee})).to.emit(raffle, "RaffleEnter");
            })

            it("doesnt allow entrance when raffle is calculating", async function() {
                await raffle.enterRaffle({value: raffleEntranceFee});
                // increase the time of the blockchain https://hardhat.org/hardhat-network/docs/reference#evm_increasetime
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                // mine 1 block
                await network.provider.send("evm_mine", []);
                await raffle.performUpkeep([])
                await expect(raffle.enterRaffle({value: raffleEntranceFee})).to.be.revertedWithCustomError(raffle, "Raffle__NotOpen");
            })
        })

        describe("checkUpkeep", function() {
            it("returns false if people havent sent any ETH", async function() {
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
                // call static to simulate transaction
                const {upkeepNeeded} = await raffle.callStatic.checkUpkeep([]) // this should return false
                assert.equal(upkeepNeeded, false);
            })

            it("returns false if raffle isnt open", async function() {
                await raffle.enterRaffle({value: raffleEntranceFee});
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
                await raffle.performUpkeep([]);
                const raffleState = await raffle.getRaffleState();
                const {upkeepNeeded} = await raffle.callStatic.checkUpkeep([]);
                assert(raffleState.toString(), "1");
                assert.equal(upkeepNeeded, false);
            })

            it("returns false if enough time hasnt passed", async function() {
                await raffle.enterRaffle({value: raffleEntranceFee});
                await network.provider.send("evm_increaseTime", [interval.toNumber() - 5]);
                await network.provider.send("evm_mine", []);
                const {upkeepNeeded} = await raffle.callStatic.checkUpkeep([]);
                assert.equal(upkeepNeeded, false);
            })

            it("returns true if enough time has passed, has players, eth and is open", async function() {
                await raffle.enterRaffle({value: raffleEntranceFee});
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
                const {upkeepNeeded} = await raffle.callStatic.checkUpkeep([]);
                assert.equal(upkeepNeeded, true);
            })
        })

        describe("performUpkeep", function() {
            it("can only run if checkUpkeep is true", async function() {
                await raffle.enterRaffle({value:raffleEntranceFee});
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
                const tx = await raffle.performUpkeep([]);
                assert(tx);
            })

            it("reverts when checkUpkeep is false", async function() {
                await expect(raffle.performUpkeep([])).to.be.revertedWithCustomError(raffle, "Raffle__UpKeepNotNeeded");
            })

            it("updates the raffle state, emits and event, and calls the vrf coordinator", async function() {
                await raffle.enterRaffle({value: raffleEntranceFee});
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
                const transactionResponse = await raffle.performUpkeep([]);
                const transactionReceipt = await transactionResponse.wait(1);
                const requestId = transactionReceipt.events[1].args.requestId;
                const raffleState = await raffle.getRaffleState();
                assert(requestId.toNumber() > 0)
                assert(raffleState.toString() == 1);
            })
        })

        describe("fulfillRandomWords", function() {
            beforeEach(async function() {
                await raffle.enterRaffle({value: raffleEntranceFee});
                await network.provider.send("evm_increaseTime", [interval.toNumber() + 1]);
                await network.provider.send("evm_mine", []);
            })

            it("can only be called after performUpkeep", async function() {
                await expect(vrfCoordinatorV2Mock.fulfillRandomWords(0, raffle.address)).to.be.revertedWith("nonexistent request");
                await expect(vrfCoordinatorV2Mock.fulfillRandomWords(1, raffle.address)).to.be.revertedWith("nonexistent request");
            })
            // way too big
            it("picks a winner, resets the lottery and send money", async function() {
                const additionalEntrants = 3;
                const startingAccountIndex = 1; // deployer = index 0
                const accounts = await ethers.getSigners();
                // connect 3 additional participants into the raffle
                for (let i= startingAccountIndex; i < startingAccountIndex + additionalEntrants; i++) {
                    const accountConnectedRaffle = raffle.connect(accounts[i]);
                    await accountConnectedRaffle.enterRaffle({value: raffleEntranceFee});
                }
                const startingTimeStamp = await raffle.getLatestTimeStamp();
                // performUpkeep (mock being Chainlink Keepers)
                // fulfillRandomWords (mock being the Chainlink VRF)
                // we will have to wait for the fulfillRandomWords to be called
                await new Promise(async function(resolve, reject) {
                    // Setting up the listener
                    raffle.once("WinnerPicked", async function() {
                        console.log("Found the event!")
                        try {
                            const raffleState = await raffle.getRaffleState();
                            const endingTimeStamp = await raffle.getLatestTimeStamp();
                            const numPlayers = await raffle.getNumberOfPlayers();
                            const winnerEndingBalance = await accounts[1].getBalance();
                            assert.equal(numPlayers.toString(), "0");
                            assert.equal(raffleState.toString(), "0");
                            assert(endingTimeStamp > startingTimeStamp);
                            assert.equal(winnerEndingBalance.toString(), winnerStartingBalance.add(raffleEntranceFee.mul(additionalEntrants).add(raffleEntranceFee)).toString());
                        } catch(error) {
                            reject(error);
                        }
                        resolve();
                    })
                    // below we will fire the event and the listener will pick it up and resolve
                    // This is only for testnet where we can generate when the random word is called, in real testnet we dont need the next lines
                    const transactionResponse = await raffle.performUpkeep([]);
                    const transactionReceipt = await transactionResponse.wait(1);
                    const winnerStartingBalance = await accounts[1].getBalance();
                    await vrfCoordinatorV2Mock.fulfillRandomWords(transactionReceipt.events[1].args.requestId, raffle.address);
                    
                })
            })
        })
    })