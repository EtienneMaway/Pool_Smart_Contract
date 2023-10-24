// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import '@openzeppelin/contracts/access/Ownable.sol';

contract PoolContract is Ownable(msg.sender) {
    // Storing the users balances
    mapping(address => uint256) public usersBalances;

    // Deposit event
    event Deposited(address indexed user, uint256 amount);

    // Withdraw event
    event WithdrawEvent(address indexed user, uint256 amount);

    // Owner withdraw event
    event ContractOwnerWithdrawn(uint256 amount);

    // Should be able to receive ETH
    receive() external payable {}

    // Function to deposit funds to the contract
    function deposit() external payable {
        // checking if the the amount to deposit is greater than 0
        require(msg.value > 0, 'amount must be greater than 0');

        // Incrementing the user's account balance
        usersBalances[msg.sender] += msg.value;

        // emitting a deposit event
        emit Deposited(msg.sender, msg.value);
    }

    // funtion to withdraw funds
    function withdraw(uint256 _amount) external {
        // check if the caller has a balance
        require(_amount > 0, 'cannot withdraw 0 fund or less');

        // check if the balance is enougth
        require(
            _amount <= usersBalances[msg.sender],
            'cannot withdraw more than the balance'
        );

        // Transfering the funds to the caller
        payable(msg.sender).transfer(_amount);

        // decremeting the caller's balance
        usersBalances[msg.sender] -= _amount;

        // emitting Withdraw event
        emit WithdrawEvent(msg.sender, _amount);
    }

    // Contract withdraw function
    function contractOwnerWithdraw(uint256 _amount) external onlyOwner {
        // never withdraw 0 amount
        require(_amount > 0, 'cannot withdraw 0 fund or less');

        // not withdrawing more than the contract balance
        require(_amount <= address(this).balance, 'Insuficient balance');

        // ability to send the money to the owner EOA
        payable(owner()).transfer(_amount);

        // emitting a successful ContractOwnerWithdrawn event
        emit ContractOwnerWithdrawn(_amount);
    }

    function getPoolBalance() external view returns (uint256 _amount) {
        return address(this).balance;
    }
}
