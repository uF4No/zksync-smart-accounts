
import { HardhatRuntimeEnvironment } from "hardhat/types";


// as well as verify it on Block Explorer if possible for the network
export default async function (hre: HardhatRuntimeEnvironment) {

  console.log(`Running script on ${hre.network.name} network`);

  const contractArtifactName = "DummyInitAccount";
  const constructorArguments = [];

  const artifact = await hre.deployer.loadArtifact(contractArtifactName);
  const contract = await hre.deployer.deploy(artifact, constructorArguments, "createAccount");

  const ACCOUNT_ADDRESS = await contract.getAddress();
  console.log(`InitAccount deployed to: ${ACCOUNT_ADDRESS}`);

  if(!hre.network.name.includes("Node")) {
    const fullContractSource = `${artifact.sourceName}:${artifact.contractName}`;

    await hre.run("verify:verify", {
      address: ACCOUNT_ADDRESS,
      constructorArguments: [],
      contract: fullContractSource,
      noCompile: true,
    });
  }

  // const rich = await hre.deployer.getWallet(0)

  // const provider = new Provider("http://127.0.0.1:8011");

  // console.log('provider :>> ', provider);

  // console.log(`Network is ${await provider.getNetwork()}`);

  // console.log(`The balance of the account is: ${await provider.getBalance(ACCOUNT_ADDRESS)}`);

  // const fundTx = await rich.sendTransaction({ to: ACCOUNT_ADDRESS, value: ethers.parseEther("1.1") });
  // console.log(`Transaction hash of funding account: ${fundTx.hash}`);
  // await fundTx.wait();
  // console.log(`The balance of the account is: ${await provider.getBalance(ACCOUNT_ADDRESS)}`);

}
