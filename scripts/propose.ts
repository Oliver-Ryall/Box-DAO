import { ethers, network } from 'hardhat';
import { NEW_STORE_VALUE, FUNC, PROPOSAL_DESCRIPTION, developmentChains } from "../helper-hardhat-config"
import { moveBlocks } from "../utils/move-blocks"
import { moveTime } from "../utils/move-time"
import { VOTING_DELAY, proposalsFile } from "../helper-hardhat-config"
import * as fs from "fs"

export async function propose(args: any[], functionCall: string, proposalDescription: string) {
    const governorContract = await ethers.getContract("BoxGovernor");
    const boxContract = await ethers.getContract("Box");
    const encodedFuctionCall = boxContract.interface.encodeFunctionData(
        functionCall,
        args,
    );
    console.log(encodedFuctionCall);
    console.log(`Proposing ${functionCall} on ${boxContract.address} with ${args}`);
    console.log(`Proposal description: \n ${proposalDescription}`);
    const proposeTx = await governorContract.propose(
        [boxContract.address],
        [0],
        [encodedFuctionCall],
        proposalDescription
    )
    const proposeReceipt = await proposeTx.wait(1);

    if(developmentChains.includes(network.name)) {
           await moveBlocks(VOTING_DELAY + 1);
    } 

    const proposalId = proposeReceipt.events[0].args.proposalId;
    let proposals = JSON.parse(fs.readFileSync(proposalsFile, 'utf8'));
    proposals[network.config.chainId!.toString()].push(proposalId.toString());
    fs.writeFileSync(proposalsFile, JSON.stringify(proposals))
}

propose([NEW_STORE_VALUE], FUNC, PROPOSAL_DESCRIPTION).then(() => process.exit(0)).catch((error) => {console.log(error); process.exit(1)});