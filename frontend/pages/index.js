import { BigNumber, Contract, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";

import styles from "../styles/Home.module.css";

import { abi as NFT_CONTRACT_ABI } from "../constants/CryptoDevs.json";
import { abi as TOKEN_CONTRACT_ABI } from "../constants/CryptoDevToken.json";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Triangle } from "react-loader-spinner";
// import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";

export default function Home() {
  const zero = BigNumber.from(0);
  const web3Ref = useRef();

  const [walletConnected, setWalletConnected] = useState(false);
  const [connectAddress, setconnectAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero);
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(zero);
  const [tokenAmount, setTokenAmount] = useState(zero);
  const [tokensMinted, setTokensMinted] = useState(zero);
  const [isOwner, setIsOwner] = useState(false);
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  // const web3ModalRef = useRef();

  const NFT_CONTRACT_ADDRESS = "0xb42BeD20683D67d43844aD9f0B33C3a80CbeFC49";
  const TOKEN_CONTRACT_ADDRESS = "0x90422E95fDCc6A5dC2e047c774E0968dFeFB38ae";

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Make sure you have metamask!");
      return;
    } else {
      console.log("We have the ethereum object", ethereum);
    }

    const accounts = await ethereum.request({ method: "eth_accounts" });

    if (accounts.length != 0) {
      const account = accounts[0];
      console.log("Found an authorized account:", account);
      setconnectAddress(account);
    } else {
      console.log("No authorized account found");
    }
  };

  const getTokensToBeClaimed = async () => {
    try {
      const provider = await getProviderOrSigner();
      // Create an instance of NFT Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider);
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);

      const signer = await getProviderOrSigner(true);

      const address = await signer.getAddress();
      const balance = await nftContract.balanceOf(address);

      if (balance === zero) {
        setTokensToBeClaimed(zero);
      } else {
        var amount = 0;

        for (var i = 0; i < balance; i++) {
          const tokenId = await nftContract.tokenOfOwnerByIndex(address, i);
          const claimed = await tokenContract.tokenIdsClaimed(tokenId);
          if (!claimed) {
            amount++;
          }
        }
        setTokensToBeClaimed(BigNumber.from(amount));
      }
    } catch (error) {
      console.error(error);
      setTokensToBeClaimed(zero);
    }
  };

  //get balance of partucular address
  const getBalanceOfCryptoDevTokens = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      const balance = await tokenContract.balanceOf(address);
      setBalanceOfCryptoDevTokens(balance);
    } catch (err) {
      console.error(err);
      setBalanceOfCryptoDevTokens(zero);
    }
  };

  const getTotalTokensMinted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // Create an instance of token contract
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
      // Get all the tokens that have been minted
      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted);
    } catch (err) {
      console.error(err);
    }
  };

  const mintCryptoDevToken = async (amount) => {
    try {
      const signer = await getProviderOrSigner(true);

      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);

      const value = 0.01 * amount;

      const tx = await tokenContract.mint(amount, { value: utils.parseEther(value.toString()) });

      setLoading(true);
      await tx.wait();

      setLoading(false);
      toast.success("Successfully minted HiberNuts Tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (error) {
      console.log(error);
    }
  };

  const claimCryptoDevTokens = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      // Create an instance of tokenContract
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);

      const tx = await tokenContract.claim();
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);

      toast.success("Sucessfully claimed HiberNuts Tokens");
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (error) {
      console.log(error);
    }
  };

  const getOwner = async () => {
    try {
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);

      const _owner = await tokenContract.owner();

      const signer = await getProviderOrSigner(true);

      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const withdrawCoins = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);

      const tx = await tokenContract.withdraw();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await getOwner();
    } catch (err) {
      console.error(err);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    const web3Modal = new Web3Modal({
      providerOptions: {}, // required
    });

    const provider = await web3Modal.connect();
    const web3Provider = new providers.Web3Provider(provider);

    const { chainId } = await web3Provider.getNetwork();
    if (chainId != 5) {
      toast.info("Please connect to Goerli network");
      throw new Error("Change network to Goerli");
    }
    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  //conect wallet
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!walletConnected) {
      new Web3Modal({
        providerOptions: {},
      });
      connectWallet();
      getTotalTokensMinted();
      getBalanceOfCryptoDevTokens();
      getTokensToBeClaimed();
      checkIfWalletIsConnected();
      // withdrawCoins();
    }
  }, [walletConnected]);

  const renderButton = () => {
    if (loading) {
      <Triangle
        height="80"
        width="80"
        color="#000000"
        ariaLabel="triangle-loading"
        wrapperStyle={{}}
        wrapperClassName=""
        visible={true}
      />;
    }
    if (walletConnected && isOwner) {
      return (
        <div>
          <button className={styles.button1} onClick={withdrawCoins}>
            Withdraw Coins
          </button>
        </div>
      );
    }

    if (tokensToBeClaimed > 0) {
      return (
        <div>
          <div className={styles.description}>{tokensToBeClaimed * 10} Tokens can be claimed!</div>
          <button className={styles.button} onClick={claimCryptoDevTokens}>
            Claim Tokens
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: "flex-col" }}>
        <div>
          <input
            type="number"
            placeholder="Amount of Tokens"
            // BigNumber.from converts the `e.target.value` to a BigNumber
            onChange={(e) => setTokenAmount(BigNumber.from(e.target.value))}
            className={styles.input}
          />
        </div>

        <button className={styles.button} disabled={!(tokenAmount > 0)} onClick={() => mintCryptoDevToken(tokenAmount)}>
          Mint Tokens
        </button>
      </div>
    );
  };

  return (
    <div className={styles.html}>
      <Head>
        <title>Hiber Nuts</title>
        <meta name="description" content="ICO-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Hiber Nuts ICO!</h1>
          <div className={styles.description}>You can claim or mint HiberNuts tokens here</div>

          {walletConnected ? (
            <div>
              <div className={styles.description}>
                You have minted {utils.formatEther(balanceOfCryptoDevTokens)} HiberNuts Tokens
              </div>
              <div className={styles.description}>
                Overall {utils.formatEther(tokensMinted)}/10000 have been minted!!!
              </div>
              {renderButton()}
            </div>
          ) : (
            <button onClick={connectWallet} className={styles.button}>
              Connect your wallet
            </button>
          )}
        </div>
      </div>
      <div className={styles.imgDiv}>
        <img
          className={styles.image}
          src="https://media3.giphy.com/media/4swDMy5lODZUR2OpxQ/200w.webp?cid=ecf05e476noy3idrd38opx0auz077k0341ye4sq23a0h2ftj&rid=200w.webp&ct=g"
        />
      </div>
    </div>
  );
}
