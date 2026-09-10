// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AggregatorV3Interface} from "../interfaces/AggregatorV3Interface.sol";

contract MockAggregator is AggregatorV3Interface {
    uint8 public immutable override decimals;
    int256 private _answer;
    uint256 private _updatedAt;
    string public override description;
    uint256 public constant override version = 1;

    constructor(uint8 decimals_, int256 initialAnswer, string memory description_) {
        decimals = decimals_;
        description = description_;
        _answer = initialAnswer;
        _updatedAt = block.timestamp;
    }

    function setAnswer(int256 answer) external {
        _answer = answer;
        _updatedAt = block.timestamp;
    }

    function latestRoundData()
        external
        view
        override
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (1, _answer, _updatedAt, _updatedAt, 1);
    }
}
