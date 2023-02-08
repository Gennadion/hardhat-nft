const { assert, expect } = require("chai");
const { network, deployments, ethers } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat.config");

!developmentChains.includes(network.name)
	? describe.skip
	: describe("Random IPFS NFT Unit Tests", function () {
			beforeEach(async function () {
				deployer = (await getNamedAccounts()).deployer;
				await deployments.fixture(["all"]);
				randomIpfsNft = await ethers.getContract("RandomIpfsNft", deployer);
				vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock", deployer);
				const subscriptionId = randomIpfsNft.getSubscriptionId();
				await vrfCoordinatorV2Mock.addConsumer(subscriptionId, randomIpfsNft.address);
			});
			describe("constructor", function () {
				it("initializes the contract correctly", async function () {
					const mintFee = await randomIpfsNft.getMintFee();
					const randomIpfsNftTokenCounter = await randomIpfsNft.getTokenCounter();
					assert.equal(mintFee.toString(), "10000000000000000");
					assert.equal(randomIpfsNftTokenCounter.toString(), "0");
				});
			});
			describe("requestNft", function () {
				it("reverts when you don't pay enough", async function () {
					await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
						"RandomIpfsNft__NotEnoughETH"
					);
				});
				it("emits event on request", async function () {
					const mintFee = await randomIpfsNft.getMintFee();
					await expect(randomIpfsNft.requestNft({ value: mintFee })).to.emit(
						randomIpfsNft,
						"NftRequested"
					);
				});
			});

			/** TODO: fulfillrandomwords */
			describe("fulfillRandomWords", function () {
				it("mints NFT after random number is returned ", async function () {
					await new Promise(async (resolve, reject) => {
						randomIpfsNft.once("NftMinted", async () => {
							try {
								const tokenUri = await randomIpfsNft.getDogTokenUris("0");
								const tokenCounter = await randomIpfsNft.getTokenCounter();
								assert.equal(tokenUri.toString().includes("ipfs://"), true);
								assert.equal(tokenCounter.toString(), "1");
								resolve();
							} catch (error) {
								console.log(error);
								reject(error);
							}
						});
						try {
							const mintFee = await randomIpfsNft.getMintFee();
							const requestNftResponse = await randomIpfsNft.requestNft({
								value: mintFee,
							});
							const requestNftReceipt = await requestNftResponse.wait(1);
							await vrfCoordinatorV2Mock.fulfillRandomWords(
								requestNftReceipt.events[1].args.requestId,
								randomIpfsNft.address
							);
						} catch (error) {
							console.log(error);
							reject(error);
						}
					});
				});
			});

			describe("getBreedFromModdedRng", async function () {
				it("pug is selected if index is < 10", async () => {
					const moddedRng = await randomIpfsNft.getBreedFromModdedRng(7);
					assert.equal(0, moddedRng);
				});
				it("shiba-inu is selected if index is < 40 and > 10", async () => {
					const moddedRng = await randomIpfsNft.getBreedFromModdedRng(19);
					assert.equal(1, moddedRng);
				});
				it("st-bernard is selected if index is < 100 and > 40", async () => {
					const moddedRng = await randomIpfsNft.getBreedFromModdedRng(41);
					assert.equal(2, moddedRng);
				});
				it("reverts if index is > 99", async () => {
					await expect(randomIpfsNft.getBreedFromModdedRng(100)).to.be.revertedWith(
						"RandomIpfsNft__RangeOutOfBounds"
					);
				});
			});

			describe("withdraws funds", async function () {
				it("Only allows the owner to withdraw", async () => {
					const accounts = await ethers.getSigners();
					const attacker = accounts[1];
					const attackerConnectedContract = await randomIpfsNft.connect(attacker);
					await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
						"Ownable: caller is not the owner"
					);
				});
				// How to do this???
				/* it("Transfer fails if there are no funds", async () => {
					await expect(randomIpfsNft.withdraw()).to.be.revertedWith("RandomIpfsNft__TransferFailed");
				}); */
			});
	  });
