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
  const { toast } = useToast();

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

    // Check allowance before transfer
    await checkUsdcAllowance();
    
    if (parseFloat(usdcAllowance) < parseFloat(amount)) {
      toast.warning('Insufficient Allowance', `Current allowance: ${usdcAllowance} USDC. Please approve first.`);
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
      
      toast.success('Transfer Successful', 'Your USDC transfer has been initiated!');
      
      // Refresh balances after successful transfer
      await checkBalance(account);
      await checkUsdcAllowance();
    } catch (error) {
      console.error('Transfer failed:', error);
      toast.error('Transfer Failed', 'Please check console for details.');
      setIsTransferring(false);
    }
  };

  // Network options for select component
  const networkOptions = [
    { value: 'arbitrumSepolia', label: 'Arbitrum Sepolia' },
    { value: 'optimismSepolia', label: 'Optimism Sepolia' },
    { value: 'polygonAmoy', label: 'Polygon Amoy' }
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
        
              {/* Network Status */}
              <div className="mb-6 p-4 bg-gray-800/40 rounded-lg border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={currentNetwork === 'sepolia' ? 'success' : 'warning'} 
                      dot 
                    />
                    <span className="text-sm text-gray-300">Current Network:</span>
                    <span className="text-blue-400 font-semibold">
                      {NETWORKS[currentNetwork].name}
                    </span>
                  </div>
                  {currentNetwork !== 'sepolia' && (
                    <Button 
                      size="sm"
                      variant="warning"
                      onClick={switchToSepolia}
                    >
                      Switch to Sepolia
                    </Button>
                  )}
                </div>
              </div>

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
                    <Button 
                      fullWidth
                      variant="warning"
                      size="sm"
                      loading={isApproving}
                      onClick={approveUsdc}
                    >
                      {isApproving ? 'Approving...' : 'Approve USDC Spending'}
                    </Button>
                  )}
                </div>
              )}

              {/* Transfer Button */}
              <div className="mt-6">
                <Button 
                  fullWidth
                  size="lg"
                  loading={isTransferring}
                  disabled={currentNetwork !== 'sepolia' || (amount && parseFloat(usdcAllowance) < parseFloat(amount))}
                  onClick={handleTransfer}
                  icon={
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                  }
                >
                  {isTransferring ? 'Processing Transfer...' : 
                   (amount && parseFloat(usdcAllowance) < parseFloat(amount)) ? 'Approve USDC First' :
                   `Transfer to ${NETWORKS[selectedDestination].name}`}
                </Button>
              </div>

              {/* Balance and Allowance Check Buttons */}
              <div className='flex gap-2 mt-4'>
                <Button 
                  variant="secondary"
                  size="sm"
                  onClick={() => checkBalance(account)}
                  className="flex-1"
                >
                  My Balance
                </Button>
                <Button 
                  variant="secondary"
                  size="sm"
                  onClick={() => checkBalance(NETWORKS[currentNetwork].contractAddress)}
                  className="flex-1"
                >
                  Contract Balance
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={checkUsdcAllowance}
                  className="flex-1"
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
        
              {/* Transaction Status */}
              {isTransferring && (
                <div className="mt-6 text-center">
                  <Loading isLoading={isTransferring} />
                  <div className="mt-4">
                    <Typewriter text="Processing your cross-chain transfer..." />
                  </div>
                </div>
              )}
              
              {!isTransferring && transactionHash && (
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="text-center">
                    <Badge variant="info" size="lg" className="mb-3">
                      Transaction Completed!
                    </Badge>
                    <div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`https://ccip.chain.link/msg/${transactionHash}`, '_blank')}
                        icon={
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        }
                      >
                        View on CCIP Explorer
                      </Button>
                    </div>
                  </div>
                </div>
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
                  <span className="text-sm text-gray-400">Ensure you're on Ethereum Sepolia network</span>
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
