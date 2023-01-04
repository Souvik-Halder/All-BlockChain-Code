const { assert,expect } = require('chai')
const {deployments, ethers, getNamedAccounts}=require('hardhat')

describe("Fundme",async function(){
    let fundMe
    let deployer
    let mockV3Aggregator
    const sendValue=ethers.utils.parseEther("1") //This parse Ether change the 1 ether to the 1e18 wei
    beforeEach(async function(){
        //deploy our fundme contract
        // using Hardhat-deploy
        // const accounts=await ethers.getSigner();//By this way you can get the accounts
        // const accountOne=accounts[0];
         deployer=(await getNamedAccounts()).deployer//ways to get accounts on hardhat
        await   deployments.fixture(["all"])
        fundMe=await ethers.getContract("Fundme",deployer)
        mockV3Aggregator=await ethers.getContract("MockV3Aggregator",deployer)

    })
    describe("constructor",async function(){
     it("sets the aggregator address correctly",async function(){
        const response = await fundMe.priceFeed()
        assert.equal(response,mockV3Aggregator.address)
     })
    })
    describe("fund",async function(){
        it("Fails if you dont send enough ETH",async function(){
            // await fundMe.fund() //else you can do the same with  expect keyword
            await expect(fundMe.fund()).to.be.reverted
        })
        it("update the amount funded data structure",async function(){
            await fundMe.fund({value:sendValue})
            const response=await fundMe.addressToAmountFunded(
                deployer
            )
            assert.equal(response.toString(),sendValue.toString())
        })
        it("Adds funder to array of funders",async function(){
            await fundMe.fund({value:sendValue})
            const funder=await fundMe.funders(0);
            assert.equal(funder,deployer)
        })
    })
    describe("withdraw",async function(){
        beforeEach(async function(){
            await fundMe.fund({value:sendValue})
        })
        it("withdraw ETH from a single founder",async function(){
            //Arrange
            //starting balance fundme  contract and starting balance of the provider
            const startingFundMeBalance=await fundMe.provider.getBalance(fundMe.address)
            const startingDeployerBalance=await fundMe.provider.getBalance(deployer) 
    

             //Act
            const transactionResponse=await fundMe.withdraw()
            const transactionRecipt=await transactionResponse.wait(1);

            //The transaction Recipt contains the gas cost so we can grab this from that
            //Fetching them from it
            const {gasUsed,effectiveGasPrice}=transactionRecipt;
            const gasCost=gasUsed.mul(effectiveGasPrice)
        //same we need to use the multiply mul method to multiplication of these two because these two numbers are big number
            const endingFundmeBalance=await fundMe.provider.getBalance(fundMe.address);
            const endingDeployerBalance=await fundMe.provider.getBalance(deployer) 
            //Assert
            //gasCost

            assert.equal(endingFundmeBalance,0)
            assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString()
            ,endingDeployerBalance.add(gasCost).toString())//here we need to use the add function to add the numbers as the numbers are very big number so it can't be done by the + sign
         //here we need to add gasCost with endingBalance because there are some gasPrice included when the the deployer balance is withdrawn and deployed so we need to add this to make it equal
        })
    })
})