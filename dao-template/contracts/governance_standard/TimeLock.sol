// we want to wait for a new vote to be "executed"
// everyone who holds the governance token has to pay 5 tokens
// give time to users to get out if they dont like the governance update

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/governance/TimelockController.sol";

contract TimeLock is TimelockController {
    // minDelay: how long you have to wait before executing
    // proposers: is the list of addresses that can propose
    // executors: who can execute when a proposal passes
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors
    ) TimelockController(minDelay, proposers, executors, msg.sender) {}
}