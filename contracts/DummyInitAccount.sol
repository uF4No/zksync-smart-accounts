// SPDX-License-Identifier: MIT

pragma solidity 0.8.20;

import {IAccount, ACCOUNT_VALIDATION_SUCCESS_MAGIC} from "@matterlabs/zksync-contracts/l2/system-contracts/interfaces/IAccount.sol";
import {TransactionHelper, Transaction} from "@matterlabs/zksync-contracts/l2/system-contracts/libraries/TransactionHelper.sol";
import {SystemContractsCaller} from "@matterlabs/zksync-contracts/l2/system-contracts/libraries/SystemContractsCaller.sol";
import {SystemContractHelper} from "@matterlabs/zksync-contracts/l2/system-contracts/libraries/SystemContractHelper.sol";
import {EfficientCall} from "@matterlabs/zksync-contracts/l2/system-contracts/libraries/EfficientCall.sol";
import {BOOTLOADER_FORMAL_ADDRESS, NONCE_HOLDER_SYSTEM_CONTRACT, DEPLOYER_SYSTEM_CONTRACT, INonceHolder} from "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";
import {Utils} from "@matterlabs/zksync-contracts/l2/system-contracts/libraries/Utils.sol";

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

/**
 * @author Matter Labs
 * @custom:security-contact security@matterlabs.dev
 * @notice The default implementation of account.
 * @dev The bytecode of the contract is set by default for all addresses for which no other bytecodes are deployed.
 * @notice If the caller is not a bootloader always returns empty data on call, just like EOA does.
 * @notice If it is delegate called always returns empty data, just like EOA does.
 */
contract DummyInitAccount is IAccount, Initializable {
    using TransactionHelper for *;

    // Remove constructor in favour of initialize method
    function initialize() public initializer {
        // No need to do anything
    }

    /**
     * @dev Simulate the behavior of the EOA if the caller is not the bootloader.
     * Essentially, for all non-bootloader callers halt the execution with empty return data.
     * If all functions will use this modifier AND the contract will implement an empty payable fallback()
     * then the contract will be indistinguishable from the EOA when called.
     */
    modifier onlyBootloader() {
        require(
            msg.sender == BOOTLOADER_FORMAL_ADDRESS,
            "Only bootloader can call this function"
        );
        // Continue execution if called from the bootloader.
        _;
    }

    /// @notice Validates the transaction & increments nonce.
    /// @dev The transaction is considered accepted by the account if
    /// the call to this function by the bootloader does not revert
    /// and the nonce has been set as used.
    /// @param _suggestedSignedHash The suggested hash of the transaction to be signed by the user.
    /// This is the hash that is signed by the EOA by default.
    /// @param _transaction The transaction structure itself.
    /// @dev Besides the params above, it also accepts unused first parameter "_txHash", which
    /// is the unique (canonical) hash of the transaction.
    function validateTransaction(
        bytes32, // _txHash
        bytes32 _suggestedSignedHash,
        Transaction calldata _transaction
    ) external payable override onlyBootloader returns (bytes4 magic) {
        // Incrementing the nonce of the account.
        // Note, that reserved[0] by convention is currently equal to the nonce passed in the transaction
        SystemContractsCaller.systemCallWithPropagatedRevert(
            uint32(gasleft()),
            address(NONCE_HOLDER_SYSTEM_CONTRACT),
            0,
            abi.encodeCall(
                INonceHolder.incrementMinNonceIfEquals,
                (_transaction.nonce)
            )
        );

        magic = ACCOUNT_VALIDATION_SUCCESS_MAGIC;
    }

    /// @notice Method called by the bootloader to execute the transaction.
    /// @param _transaction The transaction to execute.
    /// @dev It also accepts unused _txHash and _suggestedSignedHash parameters:
    /// the unique (canonical) hash of the transaction and the suggested signed
    /// hash of the transaction.
    function executeTransaction(
        bytes32, // _txHash
        bytes32, // _suggestedSignedHash
        Transaction calldata _transaction
    ) external payable override onlyBootloader {
        _execute(_transaction);
    }

    /// @notice Method that should be used to initiate a transaction from this account by an external call.
    /// @dev The custom account is supposed to implement this method to initiate a transaction on behalf
    /// of the account via L1 -> L2 communication. However, the default account can initiate a transaction
    /// from L1, so we formally implement the interface method, but it doesn't execute any logic.
    /// @param _transaction The transaction to execute.
    function executeTransactionFromOutside(
        Transaction calldata _transaction
    ) external payable override {
        // Behave the same as for fallback/receive, just execute nothing, returns nothing
    }

    /// @notice Inner method for executing a transaction.
    /// @param _transaction The transaction to execute.
    function _execute(Transaction calldata _transaction) internal {
        address to = address(uint160(_transaction.to));
        uint128 value = Utils.safeCastToU128(_transaction.value);
        bytes calldata data = _transaction.data;
        uint32 gas = Utils.safeCastToU32(gasleft());

        (bool success, ) = to.call{value: value, gas: gas}(_transaction.data);
        require(success, "Failed to execute the transaction");
    }

    /// @notice Method for paying the bootloader for the transaction.
    /// @param _transaction The transaction for which the fee is paid.
    /// @dev It also accepts unused _txHash and _suggestedSignedHash parameters:
    /// the unique (canonical) hash of the transaction and the suggested signed
    /// hash of the transaction.
    function payForTransaction(
        bytes32, // _txHash
        bytes32, // _suggestedSignedHash
        Transaction calldata _transaction
    ) external payable onlyBootloader {
        bool success = _transaction.payToTheBootloader();
        require(success, "Failed to pay the fee to the operator");
    }

    /// @notice Method, where the user should prepare for the transaction to be
    /// paid for by a paymaster.
    /// @dev Here, the account should set the allowance for the smart contracts
    /// @param _transaction The transaction.
    /// @dev It also accepts unused _txHash and _suggestedSignedHash parameters:
    /// the unique (canonical) hash of the transaction and the suggested signed
    /// hash of the transaction.
    function prepareForPaymaster(
        bytes32, // _txHash
        bytes32, // _suggestedSignedHash
        Transaction calldata _transaction
    ) external payable onlyBootloader {
        _transaction.processPaymasterInput();
    }

    fallback() external payable {
        // fallback of default account shouldn't be called by bootloader under no circumstances
        assert(msg.sender != BOOTLOADER_FORMAL_ADDRESS);

        // If the contract is called directly, behave like an EOA
    }

    receive() external payable {
        // If the contract is called directly, behave like an EOA
    }
}
