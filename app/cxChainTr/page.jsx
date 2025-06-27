'use client'
import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import Loading from "../Loading";
import Typewriter from "../Typewriter";
import Logo from '../chainlink-logo.svg';
import logo from '../CROSSLINK.png'
import Image from "next/image";
const contractABI = require('./abi.json');

// Standard ERC20 ABI for USDC token interactions
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [
      {"name": "_owner", "type": "address"},
      {"name": "_spender", "type": "address"}
    ],
    "name": "allowance",
    "outputs": [{"name": "", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "_spender", "type": "address"},
      {"name": "_value", "type": "uint256"}
    ],
    "name": "approve",
    "outputs": [{"name": "", "type": "bool"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  }
];

// CCIP Network Configuration with Public RPC Endpoints
const NETWORKS = {
  sepolia: {
    name: 'Ethereum Sepolia',
    chainId: 11155111,
    chainSelector: '16015286601757825753',
    contractAddress: '0xfe23859bDD70d306b06701b01ec62786A2773803', // Update after Remix deployment
    usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    rpcUrl: 'https://ethereum-sepolia.blockpi.network/v1/rpc/public',
    fallbackRpc: 'https://rpc.sepolia.org'
  },
  arbitrumSepolia: {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    chainSelector: '3478487238524512106',
    contractAddress: '0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165',
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    fallbackRpc: 'https://arbitrum-sepolia.blockpi.network/v1/rpc/public'
  },
  optimismSepolia: {
    name: 'Optimism Sepolia',
    chainId: 11155420,
    chainSelector: '5224473277236331295',
    contractAddress: '0x114A20A10b43D4115e5aeef7345a1A71d2a60C57',
    usdcAddress: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
    rpcUrl: 'https://sepolia.optimism.io',
    fallbackRpc: 'https://optimism-sepolia.blockpi.network/v1/rpc/public'
  },
  polygonAmoy: {
    name: 'Polygon Amoy',
    chainId: 80002,
    chainSelector: '16281711391670634445',
    contractAddress: '0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2',
    usdcAddress: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    fallbackRpc: 'https://polygon-amoy.blockpi.network/v1/rpc/public'
  }
};

export default function USDCBridge() {
  const [account, setAccount] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('arbitrumSepolia');
  const [isTransferring, setIsTransferring] = useState(false);
  const [balance, setBalance] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [web3, setWeb3] = useState(null);
  const [currentNetwork, setCurrentNetwork] = useState('sepolia');
  const [usdcAllowance, setUsdcAllowance] = useState('0');
  const [isApproving, setIsApproving] = useState(false);
  const [approvalNeeded, setApprovalNeeded] = useState(false);

  useEffect(() => {
    const loadWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        try {
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setAccount(accounts[0]);
        } catch (error) {
          console.error('Error connecting to MetaMask:', error);
          alert('Error connecting to MetaMask. See console for more details.');
        }
      } else {
        alert('MetaMask is not installed. Please consider installing it to interact with this app.');
      }
    };
    loadWeb3();
  }, []);

  // Check allowance when account, amount, or network changes
  useEffect(() => {
    if (account && web3 && amount) {
      checkUsdcAllowance();
    }
  }, [account, web3, amount, currentNetwork]);

  const checkBalance = async (address) => {
    if (!web3) {
      alert("Web3 is not initialized");
      return;
    }

    const currentNetworkConfig = NETWORKS[currentNetwork];
    const contract = new web3.eth.Contract(contractABI, currentNetworkConfig.contractAddress);
    try {
      const result = await contract.methods.balancesOf(address).call();
      const usdcBalance = web3.utils.fromWei(result.usdcBalance, 'mwei');
      const linkBalance = web3.utils.fromWei(result.linkBalance, 'ether');
      setBalance(`${usdcBalance} USDC and ${linkBalance} LINK`);
    } catch (error) {
      console.error('Error fetching balances:', error);
      alert('Failed to fetch balances. Check console for details.');
    }
  };

  const checkUsdcAllowance = async () => {
    if (!web3 || !account) {
      return;
    }

    const currentNetworkConfig = NETWORKS[currentNetwork];
    const usdcContract = new web3.eth.Contract(ERC20_ABI, currentNetworkConfig.usdcAddress);
    
    try {
      const allowance = await usdcContract.methods.allowance(account, currentNetworkConfig.contractAddress).call();
      const allowanceFormatted = web3.utils.fromWei(allowance, 'mwei');
      setUsdcAllowance(allowanceFormatted);
      
      // Check if approval is needed for current amount
      if (amount && parseFloat(allowanceFormatted) < parseFloat(amount)) {
        setApprovalNeeded(true);
      } else {
        setApprovalNeeded(false);
      }
    } catch (error) {
      console.error('Error checking USDC allowance:', error);
    }
  };

  const approveUsdc = async () => {
    if (!web3 || !account) {
      alert("Please connect your wallet first");
      return;
    }

    const currentNetworkConfig = NETWORKS[currentNetwork];
    const usdcContract = new web3.eth.Contract(ERC20_ABI, currentNetworkConfig.usdcAddress);
    
    setIsApproving(true);
    try {
      // Approve large amount (1 million USDC) for convenience
      const approvalAmount = web3.utils.toWei('1000000', 'mwei');
      
      const txResponse = await usdcContract.methods.approve(
        currentNetworkConfig.contractAddress,
        approvalAmount
      ).send({ from: account });
      
      console.log('USDC approval successful:', txResponse);
      alert('USDC approval successful! You can now transfer USDC.');
      
      // Refresh allowance after approval
      await checkUsdcAllowance();
      
    } catch (error) {
      console.error('USDC approval failed:', error);
      alert('USDC approval failed. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  const switchToSepolia = async () => {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chainId in hex
      });
      setCurrentNetwork('sepolia');
    } catch (error) {
      console.error('Failed to switch to Sepolia:', error);
      alert('Please manually switch to Ethereum Sepolia in your wallet');
    }
  };

  const handleTransfer = async () => {
    if (!account || !receiverAddress || !amount || !selectedDestination) {
      alert("Please fill in all fields and ensure wallet is connected.");
      return;
    }

    if (currentNetwork !== 'sepolia') {
      alert("Please switch to Ethereum Sepolia to initiate transfers.");
      return;
    }

    // Check allowance before transfer
    await checkUsdcAllowance();
    
    if (parseFloat(usdcAllowance) < parseFloat(amount)) {
      alert(`Insufficient USDC allowance. Current allowance: ${usdcAllowance} USDC. Please approve first.`);
      return;
    }

    setIsTransferring(true);
    const currentNetworkConfig = NETWORKS[currentNetwork];
    const contract = new web3.eth.Contract(contractABI, currentNetworkConfig.contractAddress);
    
    try {
      const destinationChainSelector = NETWORKS[selectedDestination].chainSelector;
      
      // Use the new transferUsdc method that supports multiple destinations
      const txResponse = await contract.methods.transferUsdc(
        destinationChainSelector,
        receiverAddress, 
        web3.utils.toWei(amount, 'mwei')
      ).send({ from: account });
      
      console.log('Transfer successful:', txResponse);
      setTransactionHash(txResponse.events.UsdcTransferred.returnValues.messageId);
      setIsTransferring(false);
      
      // Refresh balances after successful transfer
      await checkBalance(account);
      await checkUsdcAllowance();
    } catch (error) {
      console.error('Transfer failed:', error);
      alert('Transfer failed! Please check console for details.');
      setIsTransferring(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem", paddingTop: "2rem", maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
      <Image src={logo} alt="CrossLink Logo" style={{ width: 250, marginBottom: 5}}/>
      <Typewriter text="Powered by Chainlink CCIP" />
      <Image src={Logo} alt="Chainlink Logo" style={{ width: 200, marginBottom: 5}}/>
      
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6 text-white">
          Cross-Chain USDC Bridge
        </h1>
        
        {/* Network Status */}
        <div className="mb-4 p-3 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-300">
            Current Network: <span className="text-blue-400 font-semibold">{NETWORKS[currentNetwork].name}</span>
          </p>
          {currentNetwork !== 'sepolia' && (
            <button 
              onClick={switchToSepolia}
              className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Switch to Sepolia
            </button>
          )}
        </div>

        {/* Destination Network Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Destination Network
          </label>
          <select 
            value={selectedDestination} 
            onChange={(e) => setSelectedDestination(e.target.value)}
            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="arbitrumSepolia">Arbitrum Sepolia</option>
            <option value="optimismSepolia">Optimism Sepolia</option>
            <option value="polygonAmoy">Polygon Amoy</option>
          </select>
        </div>

        {/* Receiver Address Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Receiver Address
          </label>
          <input 
            type="text" 
            placeholder="0x..." 
            value={receiverAddress} 
            onChange={(e) => setReceiverAddress(e.target.value)} 
            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Amount Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount (USDC)
          </label>
          <input 
            type="number" 
            placeholder="0.0" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)} 
            className="w-full p-3 border border-gray-600 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-blue-500"
            step="0.000001"
            min="0"
          />
          
          {/* USDC Allowance Status */}
          {account && amount && (
            <div className="mt-2 p-2 bg-gray-700 rounded-lg text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">USDC Allowance:</span>
                <span className={`font-medium ${
                  parseFloat(usdcAllowance) >= parseFloat(amount || '0') 
                    ? 'text-green-400' 
                    : 'text-red-400'
                }`}>
                  {usdcAllowance} USDC
                </span>
              </div>
              {approvalNeeded && (
                <div className="mt-2">
                  <button 
                    onClick={approveUsdc}
                    disabled={isApproving}
                    className="w-full px-3 py-2 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isApproving ? 'Approving...' : 'Approve USDC Spending'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transfer Button */}
        <button 
          type="button" 
          style={buttonStyle} 
          onClick={handleTransfer}
          disabled={isTransferring || currentNetwork !== 'sepolia' || (amount && parseFloat(usdcAllowance) < parseFloat(amount))}
          className="w-full mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTransferring ? 'Transferring...' : 
           (amount && parseFloat(usdcAllowance) < parseFloat(amount)) ? 'Approve USDC First' :
           `Transfer USDC to ${NETWORKS[selectedDestination].name}`}
        </button>

        {/* Balance and Allowance Check Buttons */}
        <div className='flex gap-2 mb-4'>
          <button 
            type="button" 
            style={{...buttonStyle, fontSize: '0.8rem', padding: '6px 12px'}} 
            onClick={() => checkBalance(account)}
            className="flex-1"
          >
            My Balance
          </button>
          <button 
            type="button" 
            style={{...buttonStyle, fontSize: '0.8rem', padding: '6px 12px'}} 
            onClick={() => checkBalance(NETWORKS[currentNetwork].contractAddress)}
            className="flex-1"
          >
            Contract Balance
          </button>
          <button 
            type="button" 
            style={{...buttonStyle, fontSize: '0.8rem', padding: '6px 12px'}} 
            onClick={checkUsdcAllowance}
            className="flex-1"
          >
            Check Allowance
          </button>
        </div>

        {/* Balance Display */}
        {balance && (
          <div className="mb-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
            <p className="text-green-400 text-sm font-medium">Balance: {balance}</p>
          </div>
        )}
        
        {/* Transaction Status */}
        <Loading isLoading={isTransferring} />
        {!isTransferring && transactionHash && (
          <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm mb-2">Transaction Completed!</p>
            <a  
              href={`https://ccip.chain.link/msg/${transactionHash}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-300 underline hover:text-blue-200 text-sm"
            >
              View on CCIP Explorer →
            </a>
          </div>
        )}
        {isTransferring && <Typewriter text="Processing your cross-chain transfer..." />}

        {/* User Flow Information */}
        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">How it works:</h3>
          <ol className="text-xs text-gray-400 space-y-1">
            <li>1. Ensure you're on Ethereum Sepolia network</li>
            <li>2. Select your destination chain</li>
            <li>3. Enter receiver address and amount</li>
            <li>4. One transaction covers everything - no gas needed on destination!</li>
          </ol>
        </div>
      </div>
    </div>
  );
}


const buttonStyle = {
  background: "rgb(96, 133, 188)",
  border: "none",
  borderRadius: "5px",
  padding: "10px 20px",
  fontSize: "1rem",
  cursor: "pointer",
  transition: "0.3s",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  fontWeight: "bold",
  color: "black",
};
