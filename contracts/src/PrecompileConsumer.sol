// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title PrecompileConsumer
/// @notice Minimal helper base contract for calling Ritual Chain precompiles.
/// @dev Ritual exposes native precompiles at fixed addresses. A precompile call
///      is a normal `call` to the precompile address with ABI-encoded input.
///      For short-running async precompiles (HTTP/LLM/DKMS) the TEE result is
///      replayed back into the SAME transaction, so the return data is available
///      synchronously from the caller's point of view.
///
///      Reference: https://docs.ritualfoundation.org  (Precompile Map / Execution Models)
abstract contract PrecompileConsumer {
    // ----- Precompile addresses (from Ritual docs) -----
    address internal constant ONNX_PRECOMPILE = address(0x0800); // classical ML (sync)
    address internal constant HTTP_CALL_PRECOMPILE = address(0x0801); // HTTP (short async)
    address internal constant LLM_PRECOMPILE = address(0x0802); // LLM inference (short async)
    address internal constant JQ_PRECOMPILE = address(0x0803); // JQ JSON query (sync)

    // ----- System contracts (genesis) -----
    address internal constant RITUAL_WALLET = 0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948;
    address internal constant ASYNC_JOB_TRACKER = 0xC069FFCa0389f44eCA2C626e55491b0ab045AEF5;
    address internal constant TEE_SERVICE_REGISTRY = 0x9644e8562cE0Fe12b4deeC4163c064A8862Bf47F;
    address internal constant ASYNC_DELIVERY = 0x5A16214fF555848411544b005f7Ac063742f39F6;

    error PrecompileCallFailed(address precompile);

    /// @notice Execute a precompile and return its raw output bytes.
    function _executePrecompile(address precompile, bytes memory input)
        internal
        returns (bytes memory output)
    {
        (bool ok, bytes memory ret) = precompile.call(input);
        if (!ok) revert PrecompileCallFailed(precompile);
        return ret;
    }
}
