const { ethers, network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat.config");

module.exports = async function ({ getNamedAccounts}) {
	const { deployer } = await getNamedAccounts();

    // Basic NFT
    const basicNft = await ethers.getContract("BasicNft", deployer)
    const basicMintTx = await basicNft.mintNft()
    await basicMintTx.wait(1)
    console.log(`Basic NFT index 0 has tokenURI: ${await basicNft.tokenURI(0)}`)

};