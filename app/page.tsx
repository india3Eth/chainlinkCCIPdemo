'use client'
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button, Card, CardContent, Badge, ToastContainer, useToast } from './components/ui';
import Image from 'next/image';
import Logo from './logo.svg';

export default function Home() {
  const router = useRouter();
  const [account, setAccount] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

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
      toast.error('MetaMask Required', 'Please install MetaMask to use this application.');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      toast.error('Connection Failed', 'Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount('');
  };

  return (
    <>
      <ToastContainer />
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 max-w-4xl w-full">
          {/* Header Section */}
          <div className="text-center mb-16 animate-slide-up">
            <div className="mb-8">
              <Image src={Logo} alt="CCIP Bridge Logo" className="w-32 h-32 mx-auto mb-6" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="text-gradient">CCIP USDC</span>
              <br />
              <span className="text-white">Bridge</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Transfer USDC across chains using Chainlink CCIP. Move your USDC from Ethereum Sepolia to 
              <span className="text-blue-400 font-semibold"> Arbitrum</span>, 
              <span className="text-red-400 font-semibold"> Optimism</span>, or 
              <span className="text-purple-400 font-semibold"> Polygon</span> with security and reliability.
            </p>
            
            {/* Feature badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <Badge variant="success">Secure & Decentralized</Badge>
              <Badge variant="info">No Destination Gas</Badge>
              <Badge variant="default">Multi-Chain Support</Badge>
            </div>
          </div>

          {/* Main Action Card */}
          <div className="max-w-lg mx-auto mb-16 animate-slide-up" style={{animationDelay: '0.2s'}}>
            <Card variant="glass" className="text-center">
              <CardContent>
                {!account ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        Get Started
                      </h3>
                      <p className="text-gray-400">
                        Connect your wallet to start using the bridge
                      </p>
                    </div>
                    <Button 
                      size="lg"
                      fullWidth
                      loading={isConnecting}
                      onClick={connectWallet}
                      icon={
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      }
                    >
                      {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-3">
                        Wallet Connected
                      </h3>
                      <Badge variant="success" size="lg">
                        {account.slice(0, 6)}...{account.slice(-4)}
                      </Badge>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        size="lg"
                        onClick={() => router.push('cxChainTr')}
                        className="flex-1"
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                          </svg>
                        }
                      >
                        Start Transfer
                      </Button>
                      <Button 
                        variant="error"
                        size="lg"
                        onClick={disconnectWallet}
                        icon={
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        }
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* How it Works Section */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 animate-slide-up" style={{animationDelay: '0.4s'}}>
            {[
              {
                step: '1',
                title: 'Connect Wallet',
                description: 'Connect your MetaMask wallet',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )
              },
              {
                step: '2',
                title: 'Select Network',
                description: 'Choose your destination chain',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                )
              },
              {
                step: '3',
                title: 'Enter Details',
                description: 'Add receiver address and amount',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                )
              },
              {
                step: '4',
                title: 'Transfer',
                description: 'One transaction, no destination gas!',
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                )
              }
            ].map((item, index) => (
              <Card key={index} variant="glass" hover className="text-center">
                <CardContent>
                  <div className="text-blue-400 mb-4 flex justify-center">
                    {item.icon}
                  </div>
                  <Badge variant="info" size="sm" className="mb-3">
                    Step {item.step}
                  </Badge>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    {item.title}
                  </h4>
                  <p className="text-gray-400 text-sm">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Features Section */}
          <div className="text-center animate-slide-up" style={{animationDelay: '0.6s'}}>
            <Card variant="gradient">
              <CardContent>
                <h3 className="text-2xl font-bold text-white mb-6">
                  Why Choose CCIP Bridge?
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div className="text-green-400">
                      <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-white">Secure & Reliable</h4>
                    <p className="text-gray-400 text-sm">Powered by Chainlink's proven infrastructure</p>
                  </div>
                  <div className="space-y-3">
                    <div className="text-blue-400">
                      <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-white">Lightning Fast</h4>
                    <p className="text-gray-400 text-sm">Cross-chain transfers in minutes, not hours</p>
                  </div>
                  <div className="space-y-3">
                    <div className="text-purple-400">
                      <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-white">Cost Effective</h4>
                    <p className="text-gray-400 text-sm">No gas fees on destination chains</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  );
  );
}

