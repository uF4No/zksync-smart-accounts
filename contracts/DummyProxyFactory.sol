// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@matterlabs/zksync-contracts/l2/system-contracts/Constants.sol";
import "@matterlabs/zksync-contracts/l2/system-contracts/libraries/SystemContractsCaller.sol";

contract DummyProxyFactory {
    bytes32 public aaBytecodeHash;
    address public logic;

    event AccountDeployed(address);

    constructor(bytes32 _aaBytecodeHash, address _logic) {
        aaBytecodeHash = _aaBytecodeHash;
        logic = _logic;
    }

    function deployProxyAccount(
        bytes32 salt
    ) external returns (address proxyAddress) {
        (bool success, bytes memory returnData) = SystemContractsCaller
            .systemCallWithReturndata(
                uint32(gasleft()),
                address(DEPLOYER_SYSTEM_CONTRACT),
                uint128(0),
                abi.encodeCall(
                    DEPLOYER_SYSTEM_CONTRACT.create2Account,
                    (
                        salt,
                        aaBytecodeHash,
                        // constructor params: address logic, address admin, bytes data
                        abi.encode(logic, msg.sender, ""),
                        IContractDeployer.AccountAbstractionVersion.Version1
                    )
                )
            );
        require(success, "Deployment failed");

        (proxyAddress) = abi.decode(returnData, (address));

        //call the initialize method?

        emit AccountDeployed(proxyAddress);
    }
}
