'use client'
import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import Loading from "../Loading";
import Typewriter from "../Typewriter";
import Logo from '../chainlink-logo.svg';
import logo from '../CROSSLINK.png'
import Image from "next/image";
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Select, Badge, ToastContainer, useToast } from '../components/ui';
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
    shortName: 'Ethereum',
    chainId: 11155111,
    chainSelector: '16015286601757825753',
    contractAddress: '0xfe23859bDD70d306b06701b01ec62786A2773803', // Update after Remix deployment
    usdcAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    rpcUrl: 'https://ethereum-sepolia.blockpi.network/v1/rpc/public',
    fallbackRpc: 'https://rpc.sepolia.org',
    color: '#627EEA',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    textColor: 'text-blue-400'
  },
  arbitrumSepolia: {
    name: 'Arbitrum Sepolia',
    shortName: 'Arbitrum',
    chainId: 421614,
    chainSelector: '3478487238524512106',
    contractAddress: '0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165',
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    fallbackRpc: 'https://arbitrum-sepolia.blockpi.network/v1/rpc/public',
    color: '#28A0F0',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    textColor: 'text-cyan-400'
  },
  optimismSepolia: {
    name: 'Optimism Sepolia',
    shortName: 'Optimism',
    chainId: 11155420,
    chainSelector: '5224473277236331295',
    contractAddress: '0x114A20A10b43D4115e5aeef7345a1A71d2a60C57',
    usdcAddress: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
    rpcUrl: 'https://sepolia.optimism.io',
    fallbackRpc: 'https://optimism-sepolia.blockpi.network/v1/rpc/public',
    color: '#FF0420',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    textColor: 'text-red-400'
  },
  polygonAmoy: {
    name: 'Polygon Amoy',
    shortName: 'Polygon',
    chainId: 80002,
    chainSelector: '16281711391670634445',
    contractAddress: '0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2',
    usdcAddress: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    fallbackRpc: 'https://polygon-amoy.blockpi.network/v1/rpc/public',
    color: '#8247E5',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    textColor: 'text-purple-400'
  }
};

export default function USDCBridge() {
  const [account, setAccount] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('arbitrumSepolia');
  const [isTransferring, setIsTransferring] = useState(false);
  const [balance, setBalance] = useState('');
  const [ccipMessageId, setCcipMessageId] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [web3, setWeb3] = useState(null);
  const [currentNetwork, setCurrentNetwork] = useState('sepolia');
  const [usdcAllowance, setUsdcAllowance] = useState('0');
  const [isApproving, setIsApproving] = useState(false);
  const [approvalNeeded, setApprovalNeeded] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transferStep, setTransferStep] = useState(0); // 0: idle, 1: validation, 2: signing, 3: processing, 4: completed
  const { toast } = useToast();

  useEffect(() => {
    const initializeWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);
        // Check for existing connection without requesting accounts
        await checkConnection();
        
        // Add event listeners for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
      } else {
        console.warn('MetaMask is not installed.');
      }
    };
    
    initializeWeb3();
    
    // Cleanup event listeners
    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      // User disconnected their wallet
      disconnectWallet();
    } else {
      // User switched accounts
      setAccount(accounts[0]);
      // Reset balances when account changes
      setBalance('');
      setUsdcAllowance('0');
      setCcipMessageId('');
      setTransactionHash('');
    }
  };

  const handleChainChanged = (chainId) => {
    // Reload the page when chain changes to ensure proper state
    window.location.reload();
  };

  const checkConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      toast.error('MetaMask Required', 'Please install MetaMask to use this application.');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      toast.success('Wallet Connected', 'Your wallet has been connected successfully.');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Connection Failed', 'Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setBalance('');
    setUsdcAllowance('0');
    setTransactionHash('');
    toast.success('Wallet Disconnected', 'Your wallet has been disconnected.');
  };

  // Check allowance when account, amount, or network changes
  useEffect(() => {
    if (account && web3 && amount) {
      checkUsdcAllowance();
    }
  }, [account, web3, amount, currentNetwork]);

  // Auto-refresh balances and allowances every 30 seconds when connected
  useEffect(() => {
    let interval;
    if (account && web3) {
      interval = setInterval(() => {
        checkUsdcAllowance();
        if (balance) {
          checkBalance(account);
        }
      }, 30000); // 30 seconds
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [account, web3, balance]);

  const checkBalance = async (address) => {
    if (!web3) {
      toast.error("Connection Error", "Web3 is not initialized. Please refresh the page.");
      return;
    }

    if (!address) {
      toast.warning("Invalid Address", "No address provided for balance check.");
      return;
    }

    const currentNetworkConfig = NETWORKS[currentNetwork];
    const contract = new web3.eth.Contract(contractABI, currentNetworkConfig.contractAddress);
    try {
      const result = await contract.methods.balancesOf(address).call();
      const usdcBalance = web3.utils.fromWei(result.usdcBalance, 'mwei');
      const linkBalance = web3.utils.fromWei(result.linkBalance, 'ether');
      setBalance(`${usdcBalance} USDC and ${linkBalance} LINK`);
      toast.success("Balance Updated", "Account balances have been refreshed.");
    } catch (error) {
      console.error('Error fetching balances:', error);
      if (error.message.includes("execution reverted")) {
        toast.error("Contract Error", "Unable to fetch balances. Contract may not be deployed on this network.");
      } else if (error.message.includes("network")) {
        toast.error("Network Error", "Network connection issue. Please check your internet connection.");
      } else {
        toast.error("Balance Check Failed", "Unable to fetch balances. Please try again.");
      }
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
      if (error.message.includes("execution reverted")) {
        toast.error("Token Error", "Unable to check USDC allowance. Token contract may be invalid.");
      } else if (error.message.includes("network")) {
        toast.error("Network Error", "Network issue while checking allowance. Please try again.");
      }
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
      
      toast.success('USDC Approval Successful', 'You can now transfer USDC tokens.');
      
      // Refresh allowance after approval
      await checkUsdcAllowance();
      
    } catch (error) {
      console.error('USDC approval failed:', error);
      toast.error('USDC Approval Failed', 'Please try again.');
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
      toast.warning('Missing Information', 'Please fill in all fields and ensure wallet is connected.');
      return;
    }

    if (currentNetwork !== 'sepolia') {
      toast.warning('Wrong Network', 'Please switch to Ethereum Sepolia to initiate transfers.');
      return;
    }

    setIsTransferring(true);
    setTransferStep(1); // validation
    
    try {
      // Step 1: Validate inputs and check allowance
      await checkUsdcAllowance();
      
      if (parseFloat(usdcAllowance) < parseFloat(amount)) {
        toast.warning('Insufficient Allowance', `Current allowance: ${usdcAllowance} USDC. Please approve first.`);
        setIsTransferring(false);
        setTransferStep(0);
        return;
      }

      setTransferStep(2); // signing transaction
      const currentNetworkConfig = NETWORKS[currentNetwork];
      const contract = new web3.eth.Contract(contractABI, currentNetworkConfig.contractAddress);
      
      const destinationChainSelector = NETWORKS[selectedDestination].chainSelector;
      
      // Use the new transferUsdc method that supports multiple destinations
      const txResponse = await contract.methods.transferUsdc(
        destinationChainSelector,
        receiverAddress, 
        web3.utils.toWei(amount, 'mwei')
      ).send({ from: account });
      
      setTransferStep(3); // processing
      
      // Store transaction hash first
      setTransactionHash(txResponse.transactionHash);
      
      // Try to get the CCIP message ID from events, with multiple fallbacks
      let messageId = null;
      
      // Enhanced event parsing for CCIP Router and contract events
      if (txResponse.events) {
        
        // Priority 1: Look for standard CCIP Router events
        if (txResponse.events.CCIPSendRequested) {
          messageId = txResponse.events.CCIPSendRequested.returnValues?.messageId;
        }
        
        // Priority 2: Look for custom contract events with enhanced parsing
        if (!messageId && txResponse.events.UsdcTransferred) {
          const usdcEvent = txResponse.events.UsdcTransferred;
          
          // Try different ways to access the messageId
          if (usdcEvent.returnValues && usdcEvent.returnValues.messageId) {
            messageId = usdcEvent.returnValues.messageId;
          } else if (usdcEvent.returnValues && usdcEvent.returnValues[0]) {
            // Sometimes events are indexed arrays
            messageId = usdcEvent.returnValues[0];
          } else if (usdcEvent.raw && usdcEvent.raw.topics && usdcEvent.raw.topics[1]) {
            // Try to get from raw event topics (messageId might be in topics[1])
            messageId = usdcEvent.raw.topics[1];
          }
        }
        
        // Priority 3: Look for other common CCIP event names
        if (!messageId && txResponse.events.MessageSent) {
          messageId = txResponse.events.MessageSent.returnValues?.messageId;
        }
        
        // Priority 4: Look for any CCIP-related events
        const ccipEventNames = ['CCIPSend', 'CCIPMessage', 'CrossChainMessage', 'TokensTransferred'];
        for (const eventName of ccipEventNames) {
          if (!messageId && txResponse.events[eventName]) {
            messageId = txResponse.events[eventName].returnValues?.messageId;
            if (messageId) {
              break;
            }
          }
        }
        
        // Priority 5: Deep scan all events and raw data for messageId patterns
        if (!messageId) {
          for (const eventName in txResponse.events) {
            const event = txResponse.events[eventName];
            
            // Handle both single events and arrays of events
            const eventArray = Array.isArray(event) ? event : [event];
            
            for (const eventInstance of eventArray) {
              // Check returnValues with all possible field names
              if (eventInstance.returnValues) {
                
                // Look for messageId in various possible formats
                const possibleMessageIdFields = ['messageId', 'message_id', 'msgId', 'id', '0', '1', '2', '3'];
                for (const field of possibleMessageIdFields) {
                  if (eventInstance.returnValues[field]) {
                    const value = eventInstance.returnValues[field];
                    // Check if it looks like a valid CCIP messageId (32 bytes hex)
                    if (typeof value === 'string' && value.startsWith('0x') && value.length === 66) {
                      messageId = value;
                      break;
                    }
                  }
                }
                
                if (messageId) break;
              }
              
              // Check raw event data for messageId patterns
              if (!messageId && eventInstance.raw) {
                // Look in topics array
                if (eventInstance.raw.topics) {
                  for (let i = 0; i < eventInstance.raw.topics.length; i++) {
                    const topic = eventInstance.raw.topics[i];
                    if (typeof topic === 'string' && topic.startsWith('0x') && topic.length === 66) {
                      // Skip the first topic (event signature)
                      if (i > 0) {
                        messageId = topic;
                        break;
                      }
                    }
                  }
                }
                
                // Look in data field
                if (!messageId && eventInstance.raw.data && eventInstance.raw.data !== '0x') {
                  // Try to extract 32-byte values from data
                  const data = eventInstance.raw.data.slice(2); // Remove 0x
                  if (data.length >= 64) {
                    const potentialMessageId = '0x' + data.slice(0, 64);
                    messageId = potentialMessageId;
                  }
                }
                
                if (messageId) break;
              }
            }
            
            if (messageId) break;
          }
        }
      }
      
      // Set the CCIP message ID if found, otherwise keep it empty to show only transaction hash
      if (messageId) {
        setCcipMessageId(messageId);
      }
      
      setTransferStep(4); // completed
      toast.success('Transfer Successful', 'Your USDC transfer has been initiated!');
      
      // Refresh balances after successful transfer
      await checkBalance(account);
      await checkUsdcAllowance();
      
      // Reset after 3 seconds
      setTimeout(() => {
        setTransferStep(0);
        setIsTransferring(false);
      }, 3000);
      
    } catch (error) {
      console.error('Transfer failed:', error);
      setIsTransferring(false);
      setTransferStep(0);
      
      // Provide specific error messages based on error type
      if (error.code === 4001) {
        toast.error('Transaction Rejected', 'You rejected the transaction in MetaMask.');
      } else if (error.message.includes('insufficient funds')) {
        toast.error('Insufficient Funds', 'You don&apos;t have enough ETH to pay for gas fees.');
      } else if (error.message.includes('execution reverted')) {
        toast.error('Contract Error', 'Transfer failed. Check your USDC balance and allowance.');
      } else if (error.message.includes('network')) {
        toast.error('Network Error', 'Network connection issue. Please try again.');
      } else {
        toast.error('Transfer Failed', 'An unexpected error occurred. Please try again.');
      }
    }
  };

  // Network options for select component with enhanced visuals
  const networkOptions = [
    { 
      value: 'arbitrumSepolia', 
      label: NETWORKS.arbitrumSepolia.shortName,
      fullLabel: NETWORKS.arbitrumSepolia.name,
      color: NETWORKS.arbitrumSepolia.textColor 
    },
    { 
      value: 'optimismSepolia', 
      label: NETWORKS.optimismSepolia.shortName,
      fullLabel: NETWORKS.optimismSepolia.name,
      color: NETWORKS.optimismSepolia.textColor 
    },
    { 
      value: 'polygonAmoy', 
      label: NETWORKS.polygonAmoy.shortName,
      fullLabel: NETWORKS.polygonAmoy.name,
      color: NETWORKS.polygonAmoy.textColor 
    }
  ];

  return (
    <>
      <ToastContainer />
      <div className="min-h-screen flex flex-col items-center px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8 animate-slide-up">
          <Image src={logo} alt="CrossLink Logo" className="w-64 mx-auto mb-4"/>
          <div className="mb-4">
            <Typewriter text="Powered by Chainlink CCIP" />
          </div>
          <Image src={Logo} alt="Chainlink Logo" className="w-48 mx-auto"/>
        </div>
        
        <div className="w-full max-w-lg">
          <Card variant="glass" className="animate-slide-up">
            <CardHeader>
              <CardTitle className="text-center text-gradient">
                Cross-Chain USDC Bridge
              </CardTitle>
            </CardHeader>
            <CardContent>
              
              {/* Wallet Connection Section */}
              {!account ? (
                <div className="text-center space-y-6 mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Connect Your Wallet
                    </h3>
                    <p className="text-gray-400">
                      Connect your wallet to start using the CCIP bridge
                    </p>
                  </div>
                  {isConnecting ? (
                    <div className="space-y-4">
                      <Loading 
                        isLoading={isConnecting} 
                        variant="pulse" 
                        size="sm"
                        text="Connecting to MetaMask..."
                      />
                    </div>
                  ) : (
                    <Button 
                      size="lg"
                      fullWidth
                      onClick={connectWallet}
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      }
                    >
                      Connect MetaMask
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {/* Wallet Connected Section */}
                  <div className="mb-6 p-4 bg-gray-800/40 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge variant="success" dot />
                        <span className="text-sm text-gray-300">Connected:</span>
                        <span className="text-blue-400 font-semibold">
                          {account.slice(0, 6)}...{account.slice(-4)}
                        </span>
                      </div>
                      <Button 
                        size="sm"
                        variant="error"
                        onClick={disconnectWallet}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                </>
              )}
        
              {account && (
                <>
                
                
                {/* Transaction Progress - Show First When Processing */}
                {isTransferring && (
                  <div className="mb-6 p-6 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg">
                    <div className="text-center mb-6">
                      <Loading 
                        isLoading={isTransferring} 
                        variant="chain" 
                        size="lg"
                        text="Processing Cross-Chain Transfer"
                      />
                    </div>
                    
                    <div className="space-y-4">
                      {/* Progress Steps */}
                      <div className="flex items-center justify-between text-sm">
                        <div className={`flex items-center space-x-2 ${transferStep >= 1 ? 'text-blue-400' : 'text-gray-500'}`}>
                          <div className={`w-3 h-3 rounded-full ${transferStep >= 1 ? 'bg-blue-400' : 'bg-gray-500'}`} />
                          <span>Validating Transaction</span>
                          {transferStep > 1 && <span className="text-green-400 text-lg">✓</span>}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className={`flex items-center space-x-2 ${transferStep >= 2 ? 'text-blue-400' : 'text-gray-500'}`}>
                          <div className={`w-3 h-3 rounded-full ${transferStep >= 2 ? 'bg-blue-400' : 'bg-gray-500'}`} />
                          <span>Awaiting Signature</span>
                          {transferStep > 2 && <span className="text-green-400 text-lg">✓</span>}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className={`flex items-center space-x-2 ${transferStep >= 3 ? 'text-blue-400' : 'text-gray-500'}`}>
                          <div className={`w-3 h-3 rounded-full ${transferStep >= 3 ? 'bg-blue-400' : 'bg-gray-500'}`} />
                          <span>Processing Transfer</span>
                          {transferStep > 3 && <span className="text-green-400 text-lg">✓</span>}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className={`flex items-center space-x-2 ${transferStep >= 4 ? 'text-green-400' : 'text-gray-500'}`}>
                          <div className={`w-3 h-3 rounded-full ${transferStep >= 4 ? 'bg-green-400' : 'bg-gray-500'}`} />
                          <span>Transfer Complete</span>
                          {transferStep >= 4 && <span className="text-green-400 text-lg">✓</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 text-center">
                      <div className="text-lg font-medium text-white mb-2">
                        {transferStep === 1 ? "Validating transaction details..." :
                         transferStep === 2 ? "Please sign the transaction in MetaMask..." :
                         transferStep === 3 ? "Processing your cross-chain transfer..." :
                         transferStep === 4 ? "Transfer completed successfully!" :
                         "Processing your cross-chain transfer..."}
                      </div>
                      
                      {transferStep >= 3 && (
                        <div className="mt-4">
                          {ccipMessageId ? (
                            <div className="space-y-3">
                              <div className="text-xs text-gray-400 font-mono break-all bg-gray-900/50 p-2 rounded">
                                CCIP Message ID: {ccipMessageId}
                              </div>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => {
                                  const explorerUrl = `https://ccip.chain.link/#/side-drawer/msg/${ccipMessageId}`;
                                  window.open(explorerUrl, '_blank', 'noopener,noreferrer');
                                  toast.success('Opening CCIP Explorer', 'Track your transaction progress');
                                }}
                                icon={
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                }
                              >
                                Track on CCIP Explorer
                              </Button>
                            </div>
                          ) : (
                            <div className="text-xs text-yellow-400">
                              Getting CCIP Message ID...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Transaction Completion - Show Prominently */}
                {!isTransferring && (ccipMessageId || transactionHash) && (
                  <div className="mb-6 p-6 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="space-y-6">
                      {/* Success Header */}
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Transfer Successful!</h3>
                        <p className="text-gray-400 mb-4">
                          Your USDC has been sent to {NETWORKS[selectedDestination].name}
                        </p>
                      </div>

                      {/* Transaction Hash Section */}
                      {transactionHash && (
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-300">Transaction Hash:</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(transactionHash);
                                toast.success('Copied!', 'Transaction hash copied to clipboard');
                              }}
                              icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              }
                            >
                              Copy
                            </Button>
                          </div>
                          <div className="text-sm font-mono text-blue-400 break-all bg-gray-900/50 p-3 rounded border">
                            {transactionHash}
                          </div>
                        </div>
                      )}

                      {/* CCIP Message ID Section - Only show if different from transaction hash */}
                      {ccipMessageId && (
                        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-300">CCIP Message ID:</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(ccipMessageId);
                                toast.success('Copied!', 'CCIP Message ID copied to clipboard');
                              }}
                              icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              }
                            >
                              Copy
                            </Button>
                          </div>
                          <div className="text-sm font-mono text-green-400 break-all bg-gray-900/50 p-3 rounded border">
                            {ccipMessageId}
                          </div>
                        </div>
                      )}

                      {/* Primary Action - CCIP Explorer */}
                      <div className="text-center">
                        <Button
                          size="lg"
                          variant="primary"
                          onClick={() => {
                            const messageId = ccipMessageId || transactionHash;
                            const explorerUrl = `https://ccip.chain.link/#/side-drawer/msg/${messageId}`;
                            window.open(explorerUrl, '_blank', 'noopener,noreferrer');
                            toast.success('Opening CCIP Explorer', 'Track your cross-chain transaction in the new tab');
                          }}
                          icon={
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          }
                        >
                          View on CCIP Explorer
                        </Button>
                      </div>

                      {/* Transfer Summary */}
                      <div className="text-center border-t border-gray-700 pt-4">
                        <div className="text-sm text-gray-400 space-y-1">
                          <div><span className="text-gray-300">Route:</span> {NETWORKS.sepolia.shortName} → {NETWORKS[selectedDestination].shortName}</div>
                          <div><span className="text-gray-300">Amount:</span> {amount} USDC</div>
                          <div><span className="text-gray-300">Receiver:</span> {receiverAddress.slice(0, 6)}...{receiverAddress.slice(-4)}</div>
                        </div>
                        
                        <div className="mt-4">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setCcipMessageId('');
                              setTransactionHash('');
                              setAmount('');
                              setReceiverAddress('');
                              setBalance('');
                            }}
                            icon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            }
                          >
                            Start New Transfer
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Network Status - Only show when not processing */}
                {!isTransferring && !ccipMessageId && (
                  <div className={`mb-6 p-4 rounded-lg border ${NETWORKS[currentNetwork].bgColor} ${NETWORKS[currentNetwork].borderColor}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${currentNetwork === 'sepolia' ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-300">Source Network:</span>
                            <span className={`font-semibold ${NETWORKS[currentNetwork].textColor}`}>
                              {NETWORKS[currentNetwork].shortName}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">
                            {currentNetwork === 'sepolia' ? 'Ready for transfers' : 'Switch network required'}
                          </div>
                        </div>
                      </div>
                      {currentNetwork !== 'sepolia' && (
                        <Button 
                          size="sm"
                          variant="warning"
                          onClick={switchToSepolia}
                          icon={
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                            </svg>
                          }
                        >
                          Switch to Sepolia
                        </Button>
                      )}
                    </div>
                  </div>
                )}

              {/* Bridge Direction Visualization - Only show when form is active */}
              {!isTransferring && !ccipMessageId && (
                <div className="mb-6 p-4 bg-gray-800/40 rounded-lg border border-gray-700">
                  <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-3 sm:gap-0">
                    <div className="flex items-center space-x-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${NETWORKS.sepolia.bgColor} ${NETWORKS.sepolia.textColor} border ${NETWORKS.sepolia.borderColor}`}>
                        {NETWORKS.sepolia.shortName}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-6 h-6 text-gray-400 rotate-90 sm:rotate-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${NETWORKS[selectedDestination].bgColor} ${NETWORKS[selectedDestination].textColor} border ${NETWORKS[selectedDestination].borderColor}`}>
                        {NETWORKS[selectedDestination].shortName}
                      </div>
                    </div>
                  </div>
                  <div className="text-center mt-2">
                    <span className="text-xs text-gray-400">Cross-Chain USDC Transfer</span>
                  </div>
                </div>
              )}

              {/* Transfer Form - Only show when not processing or completed */}
              {!isTransferring && !ccipMessageId && (
                <>
                  {/* Destination Network Selection */}
                  <Select
                    label="Destination Network"
                    options={networkOptions}
                    value={selectedDestination}
                    onChange={setSelectedDestination}
                    helperText="Select the blockchain where you want to receive USDC"
                  />

                  {/* Receiver Address Input */}
                  <Input
                    label="Receiver Address"
                    type="text"
                    placeholder="0x..."
                    value={receiverAddress}
                    onChange={(e) => setReceiverAddress(e.target.value)}
                    helperText="Enter the wallet address that will receive the USDC"
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    }
                  />

                  {/* Amount Input */}
                  <Input
                    label="Amount (USDC)"
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.000001"
                    min="0"
                    helperText="Enter the amount of USDC to transfer"
                    leftIcon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    }
                  />
                </>
              )}
              
              {/* USDC Allowance Status and Transfer Controls - Only show when form is active */}
              {!isTransferring && !ccipMessageId && (
                <>
                  {/* USDC Allowance Status */}
                  {account && amount && (
                    <div className="mt-4 p-4 bg-gray-800/40 rounded-lg border border-gray-700">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-300">USDC Allowance:</span>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={parseFloat(usdcAllowance) >= parseFloat(amount || '0') ? 'success' : 'error'}
                          >
                            {usdcAllowance} USDC
                          </Badge>
                        </div>
                      </div>
                      {approvalNeeded && (
                        isApproving ? (
                          <div className="space-y-2">
                            <Loading 
                              isLoading={isApproving} 
                              variant="default" 
                              size="sm"
                              text="Approving USDC spending..."
                            />
                          </div>
                        ) : (
                          <Button 
                            fullWidth
                            variant="warning"
                            size="sm"
                            onClick={approveUsdc}
                          >
                            Approve USDC Spending
                          </Button>
                        )
                      )}
                    </div>
                  )}

                  {/* Transfer Button */}
                  <div className="mt-6">
                    <Button 
                      fullWidth
                      size="lg"
                      disabled={currentNetwork !== 'sepolia' || (amount && parseFloat(usdcAllowance) < parseFloat(amount))}
                      onClick={handleTransfer}
                      icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                        </svg>
                      }
                    >
                      {(amount && parseFloat(usdcAllowance) < parseFloat(amount)) ? 'Approve USDC First' :
                       `Transfer to ${NETWORKS[selectedDestination].name}`}
                    </Button>
                  </div>
                  
                  {/* Balance and Allowance Check Buttons */}
                  <div className='grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4'>
                    <Button 
                      variant="secondary"
                      size="sm"
                      onClick={() => checkBalance(account)}
                      className="w-full"
                    >
                      My Balance
                    </Button>
                    <Button 
                      variant="secondary"
                      size="sm"
                      onClick={() => checkBalance(NETWORKS[currentNetwork].contractAddress)}
                      className="w-full"
                    >
                      Contract Balance
                    </Button>
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={checkUsdcAllowance}
                      className="w-full"
                    >
                      Check Allowance
                    </Button>
                  </div>

                  {/* Balance Display */}
                  {balance && (
                    <div className="mt-4">
                      <Badge variant="success" size="lg" className="w-full justify-center py-3">
                        Balance: {balance}
                      </Badge>
                    </div>
                  )}
                </>
              )}
              
              </>
              )}

            </CardContent>
          </Card>
          
          {/* User Flow Information */}
          <Card variant="glass" className="mt-6 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <CardContent padding="md">
              <h3 className="text-lg font-semibold text-gray-300 mb-4 text-center">How it works:</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Badge variant="info" size="sm">1</Badge>
                  <span className="text-sm text-gray-400">Ensure you&apos;re on Ethereum Sepolia network</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="info" size="sm">2</Badge>
                  <span className="text-sm text-gray-400">Select your destination chain</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="info" size="sm">3</Badge>
                  <span className="text-sm text-gray-400">Enter receiver address and amount</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="success" size="sm">4</Badge>
                  <span className="text-sm text-gray-400">One transaction covers everything - no gas needed on destination!</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
