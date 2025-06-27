'use client'
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Home() {
  const router = useRouter();
  const [account, setAccount] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkConnection();
  }, []);

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
      alert('MetaMask is not installed. Please install MetaMask to use this application.');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount('');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center flex-col justify-between font-mono text-sm lg:flex">
        
        <div className="flex flex-col items-center gap-6 mt-20">
          <h1 className="text-4xl font-bold text-white mb-4 text-center">
            CCIP USDC Bridge
          </h1>
          <p className="text-gray-300 text-center mb-8 max-w-lg text-lg">
            Transfer USDC across chains using Chainlink CCIP. Move your USDC from Ethereum Sepolia to Arbitrum, Optimism, or Polygon with security and reliability.
          </p>

          {!account ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-gray-400 text-center mb-4">
                Connect your wallet to start using the bridge
              </p>
              <button 
                type="button" 
                style={buttonStyle} 
                onClick={connectWallet}
                disabled={isConnecting}
                className="hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-gray-800 px-4 py-2 rounded-lg">
                <p className="text-green-400 text-sm">
                  Connected: {account.slice(0, 6)}...{account.slice(-4)}
                </p>
              </div>
              <div className="flex gap-4">
                <button 
                  type="button" 
                  style={buttonStyle} 
                  onClick={() => router.push('cxChainTr')}
                  className="hover:scale-105 transition-transform"
                >
                  Start USDC Transfer
                </button>
                <button 
                  type="button" 
                  style={{...buttonStyle, background: 'rgb(239, 68, 68)'}} 
                  onClick={disconnectWallet}
                  className="hover:scale-105 transition-transform"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}

          <div className="mt-12 p-6 bg-gray-800/50 rounded-lg max-w-lg">
            <h3 className="text-lg font-semibold text-white mb-3">How it works:</h3>
            <ol className="text-sm text-gray-300 space-y-2">
              <li>1. Connect your MetaMask wallet</li>
              <li>2. Ensure you're on Ethereum Sepolia testnet</li>
              <li>3. Select your destination chain</li>
              <li>4. Enter receiver address and USDC amount</li>
              <li>5. One transaction covers everything - no gas needed on destination!</li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  );
}

// Common button styling
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
