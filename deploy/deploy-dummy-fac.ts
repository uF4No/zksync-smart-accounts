
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ethers } from "ethers";
import { Provider, utils } from "zksync-ethers";

// as well as verify it on Block Explorer if possible for the network
export default async function (hre: HardhatRuntimeEnvironment) {

  console.log(`Running script on ${hre.network.name} network`);
  
  const facArtifactName = "DummyFactory";
  const accArtifactName = "DummyAccount";

  const facArtifact = await hre.deployer.loadArtifact(facArtifactName);
  const accArtifact = await hre.deployer.loadArtifact(accArtifactName);
  // Getting the bytecodeHash of the account
  const accBytecodeHash = utils.hashBytecode(accArtifact.bytecode);

const factoryContract = await hre.deployer.deploy(
  // artifact to deploy
  facArtifact, 
  // constructor params
  [accBytecodeHash], 
  // deployment type
  "create", 
  // tx overrides
  undefined, 
  // factory deps
  [accArtifact.bytecode]);

  const fullContractSource = `${facArtifact.sourceName}:${facArtifact.contractName}`;
    
  const factoryAddress = await factoryContract.getAddress();
  console.log(`Factory deployed to: ${factoryAddress}`);

  if(!hre.network.name.includes("localhost")) {
    await hre.run("verify:verify", {
      address: factoryAddress,
      constructorArguments: [accBytecodeHash],
      contract: fullContractSource,
      noCompile: true,
    });
  }


  console.log(`Deploying account from factory...`);

  // use zero hash as salt for account creation
  const createAccTx = await factoryContract.deployAccount(ethers.ZeroHash)
  console.log(`Transaction hash of creating account: ${createAccTx.hash}`);
  createAccTx.wait()

  const accountAddress = utils.create2Address(
    // sender
    factoryAddress,
    // bytecodeHash
    await factoryContract.aaBytecodeHash(),
    // salt
    ethers.ZeroHash,
    // input
    new Uint8Array()
  );
  console.log(`Account deployed on address ${accountAddress}`);


  
}
