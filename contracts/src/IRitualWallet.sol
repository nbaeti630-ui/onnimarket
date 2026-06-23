// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Fee escrow for precompile usage on Ritual Chain.
/// @dev Deposit RITUAL before submitting precompile calls. Balance is checked
///      against the EOA, not the contract. See https://docs.ritualfoundation.org
interface IRitualWallet {
    function deposit(uint256 lockDuration) external payable;
    function depositFor(address user, uint256 lockDuration) external payable;
    function withdraw(uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function lockUntil(address account) external view returns (uint256);
}
