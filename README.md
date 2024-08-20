# ZKsync Smart accounts demo

> This project was scaffolded with [zksync-cli](https://github.com/matter-labs/zksync-cli).

This demo project contains different examples to deploy a basic smart contract account and use it to interact with a `Greeter.sol` contract.

## Important info about smart accounts on ZKsync

> Using acronym "SCA" for Smart Contract Accounts.

ZKsync implements native account abstraction. Given that SCAs (and paymasters) are first class citizens on ZKsync, they must follow certain rules to adhere to the protocol specification. It's strongly recommended to read the following pages from the ZKsync documentation:

- https://docs.zksync.io/build/developer-reference/account-abstraction
- https://docs.zksync.io/build/developer-reference/account-abstraction/design
- https://docs.zksync.io/build/developer-reference/account-abstraction/extending-4337
- https://docs.zksync.io/build/developer-reference/account-abstraction/building-smart-accounts

### Considerations for building smart accounts

- SCAs on ZKsync must implement the IAccount.sol interface methods. This interface is provided in the `zksync-contracts` NPM package and in [this repository](https://github.com/matter-labs/era-contracts).

- SCAs must increase the account nonce in the `validateTransaction` and return a specific `ACCOUNT_VALIDATION_SUCCESS_MAGIC` value if validation is successful. This value is provided in the `IAccount.sol` contract.

- Given that SCAs interact with the `NonceHolder` system contract to increase the nonce, SCAs must be compiled with `enableEraVMExtensions: true` in the compiler settings. Example:

```ts
  zksolc: {
    version: "1.5.1",
    settings: {
      enableEraVMExtensions: true
    },
  },
```

- SCAs must be deployed via the `createAccount` or `create2Account` method of the `ContractDeployer.sol` system contract. The `hardhat-zksync` plugin provides the `hre.deployer` object that allows passing the deployment type as a parameter on the `deploy` method. See `deploy-dummy-acc.ts` script for reference.

```ts
const artifact = await hre.deployer.loadArtifact(contractArtifactName);
  const contract = await hre.deployer.deploy(artifact, constructorArguments, 
  // deployment type
  "createAccount");

```

- SCAs deployed using the default `create` or `create2` will not be identified as accounts by the protocol and sending transactions from these accounts will result in the error `Validation revert: Sender is not an account`.

- Factory contracts that deploy other contracts must know the `bytecodeHash` of the contract that they'll deploy (normally passed as a factory constructor param) and its correspondent `bytecode` (passed as `factory_deps` on deployment). See the `deploy-dummy-fac.ts` and `deploy-dummy-proxy-fac.ts` scripts as reference. [Learn more about contract deployments on ZKsync here](https://docs.zksync.io/build/developer-reference/ethereum-differences/contract-deployment).

- If the SCA is a proxy with the account logic in a different implementation contract, then the proxy must be deployed with `createAccount` or `create2Account`. The implementation can be deployed with `create` or `create2`.

## Setup

- Install dependencies with `npm i`
- See the `hardhat.config.ts` for the required compiler configuration. 
- Select your desired default network (tested in `inMemoryNode` and `zkSyncSepoliaTestnet`).
- Compile all contracts with `npx hardhat compile`.
- Deploy the `Greeter.sol` contract with `npx hardhat deploy-zksync --script deploy.ts`.

## Different deployments and tests

### Default deployment

The `DummyAccount.sol` contract is a very basic smart contract account. The verification logic has been removed (for simplicity of this examples) and accepts any signature as valid.

This example deploys the account directly using `hre.deployer.deploy` and interacts with a Greeter contract.

1. Deploy the contract with `npx hardhat deploy-zksync --script deploy-dummy-acc.ts`.
2. Copy the contract address in the `ACCOUNT_ADDRESS` variable in the `fund-acc.ts` script. Run the  script to fund the account with `npx hardhat deploy-zksync --script fund-acc.ts`.
3. Add the smart contract account address and the Greeter contract address in the `interact-dummy.ts` file. Run the script with ``npx hardhat deploy-zksync --script interact-dummy.ts`

### Factory account deployment

Using the same `DummyAccount.sol` contract from the [default deployment example](#default-deployment).

In this example, the account is deployed from a factory contract (`DummyFactory.sol`).

1. Deploy the factory contract and an account with `npx hardhat deploy-zksync --script deploy-dummy-fac.ts`.
2. Copy the account address in the `ACCOUNT_ADDRESS` variable in the `fund-acc.ts` script. Run the  script to fund the account with `npx hardhat deploy-zksync --script fund-acc.ts`.
3. Add the smart contract account address and the Greeter contract address in the `interact-from-fac-acc.ts` file. Run the script with ``npx hardhat deploy-zksync --script interact-from-fac-acc.ts`

### Factory proxy account deployment

In this example, we'll have a factory that deploys smart accounts that are proxies. For this, we'll use the `DummyInitAccount.sol` (which inherits from Openzeppelin initializable), and the `DummyProxyFactory.sol` factory contract.

1. Deploy the implementation that will be used by our proxy smart contract accounts (`DummyInitAccount.sol`)with `npx hardhat deploy-zksync --script deploy-dummy-init-acc.ts`.
2. Copy the address and add it to `deploy-dummy-proxy-fac.ts` file. 
3. Deploy the factory contract and a proxy account with `npx hardhat deploy-zksync --script deploy-dummy-proxy-fac.ts`.
4. Copy the account address in the `ACCOUNT_ADDRESS` variable in the `fund-acc.ts` script. Run the  script to fund the account with `npx hardhat deploy-zksync --script fund-acc.ts`.
5. Add the smart contract account address and the Greeter contract address in the `interact-from-proxyed-acc.ts` file. Run the script with ``npx hardhat deploy-zksync --script interact-from-proxyed-acc.ts`

Testnet addresses and tx hashes:

- Greeter: [0x543A5fBE705d040EFD63D9095054558FB4498F88](https://sepolia.explorer.zksync.io/address/0x543A5fBE705d040EFD63D9095054558FB4498F88)
- DummyInitAccount (proxy implementation logic): [0xbE0e545504Eb4fA9Fa0de8D01CC227A4A3B8558D](https://sepolia.explorer.zksync.io/address/0xbE0e545504Eb4fA9Fa0de8D01CC227A4A3B8558D)
- DummyProxyFactory: [0x1609b7C8318991228c71a0b3cC11bBF95c3c7A3F](https://sepolia.explorer.zksync.io/address/0x1609b7C8318991228c71a0b3cC11bBF95c3c7A3F)
- Deployed proxy account: [0x4944DECe0b3ae884edDd9B8C6b316b889DADEDD7](https://sepolia.explorer.zksync.io/address/0x4944DECe0b3ae884edDd9B8C6b316b889DADEDD7)
-  Transaction to deploy proxy account from factory: [0x08c2d157f94877845b802ad7f23f595df2d0f9cb4558b47275f8e886e791e8ef](https://sepolia.explorer.zksync.io/tx/0x08c2d157f94877845b802ad7f23f595df2d0f9cb4558b47275f8e886e791e8ef)
- Transaction sent from proxy account: [0x632aae3f362c32dc070d12a8538ee4374e0f5b99bbdd1686994ab707cb894605](https://sepolia.explorer.zksync.io/tx/0x632aae3f362c32dc070d12a8538ee4374e0f5b99bbdd1686994ab707cb894605)


## Troubleshooting

- Funding the proxy smart contract accounts must be done from an account different from the proxy owner.

## Project Layout

- `/contracts`: Contains solidity smart contracts.
- `/deploy`: Scripts for contract deployment and interaction.
- `/test`: Test files.
- `hardhat.config.ts`: Configuration settings.



## Useful Links

- [Docs](https://era.zksync.io/docs/dev/)
- [Official Site](https://zksync.io/)
- [GitHub](https://github.com/matter-labs)
- [Twitter](https://twitter.com/zksync)
- [Discord](https://join.zksync.dev/)

## License

This project is under the [MIT](./LICENSE) license.
