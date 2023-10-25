import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import { PoolContract } from '../typechain-types';
import { assert, expect } from 'chai';

// Helper that converts ETH to Wei
const etherToWei = (balance: string) => {
  return ethers.parseEther(balance);
};

describe('Pool Contract', () => {
  // State variables
  let poolContract: PoolContract;
  let owner: Signer;
  let acc2: Signer;
  let acc3: Signer;

  /*
   * We are usind before() to keep the state of the pool contract
   * It allows us not repeat ourselves in most cases
   */
  before('Deployment', async () => {
    [owner, acc2, acc3] = await ethers.getSigners();

    const PoolContract = await ethers.getContractFactory('PoolContract');
    poolContract = await PoolContract.deploy();

    console.log('Pool Contract Address: ', await poolContract.getAddress());
  });

  // test cases
  it('should set the correct owner', async () => {
    const expectedOwner = await poolContract.owner();
    const currentOwner = await owner.getAddress();

    assert(currentOwner === expectedOwner, 'should set the correct owner');
  });

  it('should deposit funds to the pool', async () => {
    // contract balance before the deposit
    const beforePoolBal = await poolContract.getPoolBalance();

    // Acc2 depositing ETH to the pool
    const currentDepositResponse = await poolContract
      .connect(acc2)
      .deposit({ value: etherToWei('10') });

    // contract balance after the deposit
    const currentPoolBal = await poolContract.getPoolBalance();

    // Asserting the contract balance to be the correct amount
    expect(currentPoolBal).to.be.equal(
      beforePoolBal + currentDepositResponse.value
    );
  });

  // The user who deposited should have a personal balance greater than 0;
  it("should incremet the user's balance after the deposit", async () => {
    expect(
      await poolContract.usersBalances(acc2.getAddress())
    ).to.be.greaterThan(0);
  });

  it('should emit Deposit event after a successful deposit', async () => {
    // Value to deposit in Wei
    const amount = { value: etherToWei('5') };

    // The owner of the contract depositing to the pool
    // asserting that the "Deposit" event is triggered
    expect(await poolContract.deposit(amount))
      .to.emit(poolContract, 'Deposited')
      .withArgs(owner, amount);
  });

  // should not allow the deposit of a 0 or negative amount
  it('should fail if depositing amount equal 0 or less', async () => {
    await expect(
      poolContract.deposit({ value: etherToWei('0') })
    ).to.revertedWith('amount must be greater than 0');
  });

  // Perfoms individual user withdraw
  it('does a successfull withdraw', async () => {
    // State Contract balance before the withdraw
    const stateContractBal = await poolContract.getPoolBalance();

    // Acc2 withdrawing from his balance
    const amount = etherToWei('3');
    await poolContract.connect(acc2).withdraw(amount);

    // the pool contract balance after the withdraw
    const currentContractBal = await poolContract.getPoolBalance();

    // Asserting that the withdraw was successful
    expect(currentContractBal).to.equal(stateContractBal - amount);
  });

  // should adjust the balance after the withdraw
  it("should decreement the user's balance after withdraw", async () => {
    // Before decrementing the caller's balance
    const beforeWithdrawAcc2Bal = await poolContract.usersBalances(acc2);

    // amount to withdraw in Wei
    const amount = etherToWei('2');

    // Acc2 making the withdraw from his balance
    await poolContract.connect(acc2).withdraw(amount);

    // Acc2 balance after withdraw
    const afterWithdrawAcc2Bal = await poolContract.usersBalances(acc2);

    // Asserting the right amount deduction from acc2's balance
    expect(afterWithdrawAcc2Bal).to.equal(beforeWithdrawAcc2Bal - amount);
  });

  // emitting a suucessful WithdrawEvent() after the withdraw
  it('should emit a WithdrawEvent() after a successful withdraw', async () => {
    expect(await poolContract.connect(acc2).withdraw(etherToWei('1')))
      .to.emit(poolContract, 'WithdrawEvent')
      .withArgs(acc2, etherToWei('1'));
  });

  // should not allow the withdrawal of a 0 or negative amount
  it('should fail if withdrawing 0 amount or less', async () => {
    await expect(poolContract.withdraw(0)).to.revertedWith(
      'cannot withdraw 0 fund or less'
    );
  });

  // should not allow the withdrawal more than current user's balance
  it('should fail if withdrawing more than the balance', async () => {
    await expect(
      poolContract.connect(acc2).withdraw(etherToWei('8'))
    ).to.revertedWith('cannot withdraw more than the balance');
  });

  // Function to withdraw ETH from the pool contract
  it('should withdraw the funds to the owner account', async () => {
    // state balance before this withdraw happen
    const beforeContractStateBal = await poolContract.getPoolBalance();

    // amount to withdraw and the withdraw process
    const amount = etherToWei('5');
    await poolContract.contractOwnerWithdraw(amount);

    // The contract state balance after this withdraw happened
    const afterContractStateBal = await poolContract.getPoolBalance();

    // Current state balance
    const currentContractBal = beforeContractStateBal - amount;

    // asserting that the correct amount has been withdrawm to the owner account
    assert(
      currentContractBal === afterContractStateBal,
      'contractBalances not adjusted'
    );
  });

  // emitting a successful ContractOwnerWithdrawn() event
  it('should emit a successful ContractOwnerWithdrawn() event', async () => {
    expect(await poolContract.contractOwnerWithdraw(etherToWei('1')))
      .to.emit(poolContract, 'ContratOwnerWithdrawn')
      .withArgs(owner, etherToWei('1'));
  });

  // should not allow the withdrawal of a 0 or negative amount
  it('should fail if the owner withdraws 0 amount or less', async () => {
    await expect(poolContract.contractOwnerWithdraw(0)).to.revertedWith(
      'cannot withdraw 0 fund or less'
    );
  });

  // should not allow the withdrawal of more than the contract balance
  it('should fail if withdrawing more than the balance', async () => {
    await expect(
      poolContract.contractOwnerWithdraw(etherToWei('8'))
    ).to.revertedWith('Insuficient balance');
  });

  // Proving that only the owner can withdraw from the contract
  it('allow only the contract owner to withdraw from the contract', async () => {
    await expect(
      poolContract.connect(acc2).contractOwnerWithdraw(etherToWei('0.5'))
    ).to.be.reverted;
  });

  // checking the contract balance
  it("should get the balance of the pool contract", async () => {
    const contractPoolBal = await poolContract.getPoolBalance()
    console.log("The pool's balance is: ", contractPoolBal)
  })
});
