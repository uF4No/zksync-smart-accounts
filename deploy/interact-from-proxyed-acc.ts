/**
 * Interacts with a Greeter contract from a
 * proxy smart contract account deployed from a factory.
 */


import * as hre from "hardhat";
import { getWallet } from "./utils";
import { ethers } from "ethers";
import { Provider, utils, types } from "zksync-ethers";

// testnet account
const ACCOUNT_ADDRESS = "0x4944DECe0b3ae884edDd9B8C6b316b889DADEDD7"
if (!ACCOUNT_ADDRESS) throw "⛔️ Account address not found!";

// Address of the contract to interact with
// Testnet Greeter
const CONTRACT_ADDRESS = "0x543A5fBE705d040EFD63D9095054558FB4498F88"
// Local Greeter
// const CONTRACT_ADDRESS = "0x1011959EE8299b0e9900036D27Ca7EfF0C54DFF6";
if (!CONTRACT_ADDRESS) throw "⛔️ Provide address of the contract to interact with!";


// An example of a script to interact with the contract
export default async function () {
  console.log(`Running script on ${hre.network.name} network`);
  console.log(`Running script to interact with contract ${CONTRACT_ADDRESS}`);

  let provider

  if(!hre.network.name.includes("Node")) {
    // Testnet
    provider = new Provider("https://sepolia.era.zksync.dev")
  }else{
    // InMemory local node
    provider = new Provider("http://127.0.0.1:8011");
  }
  
  console.log(`The balance of the account is: ${await provider.getBalance(ACCOUNT_ADDRESS)}`);
  console.log(`The nonce of the account is: ${await provider.getTransactionCount(ACCOUNT_ADDRESS)}`);

  // Load compiled contract info
  const contractArtifact = await hre.artifacts.readArtifact("Greeter");


  // Initialize contract instance for interaction
  const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    contractArtifact.abi,
    getWallet() // Interact with the contract on behalf of this wallet
  );

  const network = await provider.getNetwork();
  const chainId = network.chainId;


  // Run contract read function
  const response = await contract.greet();
  console.log(`Current message is: ${response}`);

  // Run contract write function
  let aaTx = await contract.setGreeting.populateTransaction(`Hello from AA! It is ${new Date().toISOString()}`);
  const gasPrice = await provider.getGasPrice();
  const gasLimit = await provider.estimateGas({ ...aaTx, from: ACCOUNT_ADDRESS });

  aaTx = {
    ...aaTx,
    from: ACCOUNT_ADDRESS,
    gasLimit,
    gasPrice,
    chainId, 
    nonce: await provider.getTransactionCount(ACCOUNT_ADDRESS),
    type: 113,
    value: 0n,
    customData:{
      gasPerPubdata: utils.DEFAULT_GAS_PER_PUBDATA_LIMIT,
      customSignature: "0x1337"
    }
  }

  console.log('aaTx body :>> ', aaTx);

  // const signedTxHash = EIP712Signer.getSignedDigest(aaTx);
  const sentTx = await provider.broadcastTransaction(types.Transaction.from(aaTx).serialized);
  console.log(`Transaction sent from DummyAcc with hash ${sentTx.hash}`)

  console.log('sentTx :>> ', sentTx);
  sentTx.wait()

  // Read message after transaction
  console.log(`The message now is: ${await contract.greet()}`);
  console.log(`The nonce of the account is: ${await provider.getTransactionCount(ACCOUNT_ADDRESS)}`);
  console.log(`The balance of the account is: ${await provider.getBalance(ACCOUNT_ADDRESS)}`);


}
