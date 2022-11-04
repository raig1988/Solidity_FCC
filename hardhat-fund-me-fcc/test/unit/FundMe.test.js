const {deployments, ethers, getNamedAccounts} = require("hardhat");
const {assert, expect} = require("chai");
const {developmentChains} = require("../../helper-hardhat-config")

developmentChains.includes(network.name) 
    ? describe("FundMe", async function() {
        let fundMe
        let deployer
        let mockV3Aggregator
        const sendValue = ethers.utils.parseEther("1") // 1 ETH
        beforeEach(async function() {
            // deploy our fundMe contract
            // using hardhat-deploy
            // Other way instead of deployer to get accounts
            /// const accounts = await ethers.getSigners()
            /// const accountZero = accounts[0]
            deployer = (await getNamedAccounts()).deployer
            await deployments.fixture(["all"])
            fundMe = await ethers.getContract("FundMe", deployer)
            mockV3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
        })
    
    describe("constructor", async function() {
        it("sets the aggregator addresses correctly", async function() {
            const response = await fundMe.getPriceFeed();
            assert.equal(response, mockV3Aggregator.address);
        })
    })

    describe("fund", async function() {
        it("Fails if you don't send enough ETH", async function() {
            await expect(fundMe.fund()).to.be.revertedWith("Didnt send enough ETH");
        })
        it("updated the amount funded data structure", async function() {
            await fundMe.fund({value: sendValue})
            const response = await fundMe.getAddressToAmountFunded(deployer)
            assert.equal(response.toString(), sendValue.toString())
        })
        it("Adds funder to array of getFunder", async function() {
            await fundMe.fund({value: sendValue})
            const funder = await fundMe.getFunder(0)
            assert.equal(funder, deployer) // compare if address exists
        })
    })

    describe("withdraw", async function() {
        beforeEach(async function() {
            await fundMe.fund({ value: sendValue})
        })

        it("Withdraw ETH from a single founder", async function() {
            // Arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address); // can be also ethers.provider
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer); // can be also ethers.provider
            // Act
            const transactionResponse = await fundMe.withdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            // to find gasUsed and effectiveGasPrice from transaction receipt you can:
            /// set a breakpoint in VsCode (example line 57 click), then run an debug extension by click in JS debug terminal.
            /// run your command in this new terminal. eg yarn hardhat test
            /// There you can find that transactionReceipt has that info related to its transaction.
            const {gasUsed, effectiveGasPrice} = transactionReceipt;
            // gasCost
            const gasCost = gasUsed.mul(effectiveGasPrice); // .mul its an etherjs multiply function for bigNumbers
            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
            // Assert
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(), 
                endingDeployerBalance.add(gasCost).toString()); // .add its an etherjs bignumber function
        });

        it("Withdraw ETH from a single founder", async function() {
            // Arrange
            const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address); // can be also ethers.provider
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer); // can be also ethers.provider
            // Act
            const transactionResponse = await fundMe.cheaperWithdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            // to find gasUsed and effectiveGasPrice from transaction receipt you can:
            /// set a breakpoint in VsCode (example line 57 click), then run an debug extension by click in JS debug terminal.
            /// run your command in this new terminal. eg yarn hardhat test
            /// There you can find that transactionReceipt has that info related to its transaction.
            const {gasUsed, effectiveGasPrice} = transactionReceipt;
            // gasCost
            const gasCost = gasUsed.mul(effectiveGasPrice); // .mul its an etherjs multiply function for bigNumbers
            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
            // Assert
            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(), 
                endingDeployerBalance.add(gasCost).toString()); // .add its an etherjs bignumber function
        })

        it("allow us to withdraw with multiple getFunder", async function() {
            // Arrange
            const accounts = await ethers.getSigners();
            for (let i = 1; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(accounts[i])
                await fundMeConnectedContract.fund({value: sendValue})
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer);
            // Act
            const transactionResponse = await fundMe.withdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            const {gasUsed, effectiveGasPrice} = transactionReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);
            // Assert
            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
            assert.equal(endingFundMeBalance, 0);
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(), 
                endingDeployerBalance.add(gasCost).toString())
            // Make sure that the getFunder are reset properly
            await expect(fundMe.getFunder(0)).to.be.reverted;
            for (i = 1; i < 6; i++) {
                assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0)
            }
        })
        it("Only allows the owner to withdraw", async function () {
            const accounts = await ethers.getSigners();
            const attacker = accounts[1];
            const attackerConnectedContract = await fundMe.connect(attacker);
            await expect(attackerConnectedContract.withdraw()).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
        })

        it("cheaperWithdraw testing ...", async function() {
            // Arrange
            const accounts = await ethers.getSigners();
            for (let i = 1; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(accounts[i])
                await fundMeConnectedContract.fund({value: sendValue})
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer);
            // Act
            const transactionResponse = await fundMe.cheaperWithdraw();
            const transactionReceipt = await transactionResponse.wait(1);
            const {gasUsed, effectiveGasPrice} = transactionReceipt;
            const gasCost = gasUsed.mul(effectiveGasPrice);
            // Assert
            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address);
            const endingDeployerBalance = await fundMe.provider.getBalance(deployer);
            assert.equal(endingFundMeBalance, 0);
            assert.equal(
                startingFundMeBalance.add(startingDeployerBalance).toString(), 
                endingDeployerBalance.add(gasCost).toString())
            // Make sure that the getFunder are reset properly
            await expect(fundMe.getFunder(0)).to.be.reverted;
            for (i = 1; i < 6; i++) {
                assert.equal(await fundMe.getAddressToAmountFunded(accounts[i].address), 0)
            }
        })
    })
})
    : describe.skip