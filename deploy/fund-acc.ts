/**
 * Funds account with some ETH to pay for transactions
 */

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "ethers";
import { Provider } from "zksync-ethers";
import { getWallet } from "./utils"

const ACCOUNT_ADDRESS = "0x4944DECe0b3ae884edDd9B8C6b316b889DADEDD7"
const AMOUNT = "0.03"

export default async function (hre: HardhatRuntimeEnvironment) {
  console.log(`Running script on ${hre.network.name} network`);
  console.log('Funding account.... ');
  const rich = await getWallet()

  let provider

  if(!hre.network.name.includes("Node")) {
    // Testnet
    provider = new Provider("https://sepolia.era.zksync.dev")
  }else{
    // InMemory local node
    provider = new Provider("http://127.0.0.1:8011");
  }

  console.log(`The balance of the account is: ${await provider.getBalance(ACCOUNT_ADDRESS)}`);

  const fundTx = await rich.sendTransaction({ to: ACCOUNT_ADDRESS, value: ethers.parseEther(AMOUNT) });
  console.log(`Transaction hash of funding account: ${fundTx.hash}`);
  await fundTx.wait();
  console.log(`The balance of the account is: ${await provider.getBalance(ACCOUNT_ADDRESS)}`);

}
