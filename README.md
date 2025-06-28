# CCIP USDC Bridge - Complete Setup Guide

A modern, professional cross-chain USDC bridge using Chainlink CCIP. Transfer USDC seamlessly from Ethereum Sepolia to Arbitrum, Optimism, and Polygon testnets with an intuitive glass-morphism interface.

## 🚀 Quick Overview

- **Frontend**: Next.js with modern glass-morphism design and MetaMask integration
- **Smart Contract**: CCIP-enabled bridge supporting multiple destination chains
- **Deployment**: Remix IDE only (no complex Hardhat setup)
- **Networks**: Ethereum Sepolia → Arbitrum, Optimism, Polygon testnets
- **UI/UX**: Professional bridge interface with real-time progress tracking

## ✨ Key Features

### 🎨 Modern Interface
- **Responsive Layout**: Mobile-friendly interface with adaptive components
- **CCIP-themed Animations**: Chain-link loading animations for visual feedback
- **Real-time Progress**: Live transaction tracking with step-by-step progress

### 🔗 Wallet Integration
- **Smart Connection**: Passive wallet detection without forced connections
- **User-friendly UX**: Browse interface before connecting wallet
- **Network Detection**: Automatic network switching prompts
- **Connection State**: Clear visual feedback for wallet connection status

### 📊 Transaction Management
- **Approval System**: Integrated USDC approval with balance checking
- **Progress Tracking**: Visual progress indicators through all transaction steps
- **Error Handling**: Comprehensive error messages and recovery suggestions

### 🔍 CCIP Explorer Integration
- **Message ID Extraction**: Advanced event parsing to capture CCIP message IDs
- **Explorer Links**: Direct links to CCIP Explorer for transaction tracking
- **Transaction Hash Display**: Shows both transaction hash and CCIP message ID
- **Success Screen**: Professional completion screen with all transaction details

### 🎯 User Experience
- **One-click Transfers**: Streamlined transfer process with minimal friction
- **Visual Feedback**: Loading states, success confirmations, and error alerts
- **Copy Functions**: Easy copying of transaction hashes and message IDs
- **Progressive Layout**: Priority-based information display

## 📋 Prerequisites

- **MetaMask**: Browser extension installed
- **Testnet ETH**: For gas fees on Ethereum Sepolia
- **Testnet USDC**: For transfers (get from Chainlink faucet)
- **LINK tokens**: To fund the contract for CCIP fees

## 🛠️ Complete Setup Guide

### Step 1: Deploy Smart Contract via Remix

#### 1.1 Open Remix IDE
1. Go to [remix.ethereum.org](https://remix.ethereum.org)
2. Create a new file called `CCIPUSDCBridge.sol`

#### 1.2 Copy Contract Code
Copy the complete contract code from `/contracts/CCIPUSDCBridge.sol` in this repository into Remix.

#### 1.3 Compile Contract
1. Go to the **Solidity Compiler** tab
2. Select Solidity version `0.8.19`
3. Click **Compile CCIPUSDCBridge.sol**

#### 1.4 Deploy Contract
1. Go to **Deploy & Run Transactions** tab
2. Select **Environment**: "Injected Provider - MetaMask"
3. Ensure MetaMask is connected to **Ethereum Sepolia**
4. Select contract: **CCIPUSDCBridge**
5. Enter constructor parameters:
   - **_router**: `0x0BF3dE8c5d3e8a2B34d2BEeB17ABfcebaf363A59`
   - **_link**: `0x779877A7B0D9E8603169DdbD7836e478b4624789`
   - **_usdc**: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`
6. Click **Deploy** and confirm in MetaMask

#### 1.5 Copy Contract Address
After deployment, copy the contract address from Remix - you'll need this for the frontend.

### Step 2: Get Testnet Tokens

#### 2.1 Get Testnet ETH and LINK
Visit [Chainlink Faucet](https://faucets.chain.link/) to get:
- **Sepolia ETH**: For gas fees
- **Sepolia LINK**: To fund your contract
- **Testnet USDC**: For testing transfers

#### 2.2 Fund Your Contract with LINK
1. In MetaMask, send LINK tokens to your deployed contract address
2. Recommended: Start with 5-10 LINK for testing
3. The contract needs LINK to pay CCIP network fees

### Step 3: Configure Frontend

#### 3.1 Install Dependencies
```bash
npm install
```

#### 3.2 Update Contract Address
In `/app/cxChainTr/page.jsx`, update the contract address for Sepolia:
```javascript
sepolia: {
  contractAddress: 'YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE',
  // ... other config
}
```
Replace with the address from Remix deployment.

#### 3.3 Start Application
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

### Step 4: Test the Bridge

#### 4.1 Browse and Connect
1. Browse the interface without forced wallet connection
2. Click "Connect MetaMask" when ready to transact
3. Application will automatically prompt for Ethereum Sepolia if needed

#### 4.2 Approve USDC Spending
1. The interface shows your current USDC allowance
2. Click "Approve USDC" if allowance is insufficient
3. The approval covers 1M USDC for convenience
4. Check your balance and allowance in real-time

#### 4.3 Perform Transfer
1. Select destination chain (Arbitrum, Optimism, or Polygon)
2. Enter receiver address (your own address for testing)
3. Enter amount (start with 0.1 USDC)
4. Click "Processing Transfer..." and confirm in MetaMask
5. Watch real-time progress through validation, signing, and processing

#### 4.4 Track Results
- **Success Screen**: Shows transaction hash and CCIP message ID
- **CCIP Explorer**: Direct link to track cross-chain progress
- **Copy Functions**: Easy copying of transaction details
- **Transfer Summary**: Complete overview of the transaction

## 🌐 Network Configuration

### Ethereum Sepolia (Source Chain)
- **Chain ID**: 11155111
- **CCIP Chain Selector**: 16015286601757825753
- **RPC**: `https://ethereum-sepolia.blockpi.network/v1/rpc/public`
- **USDC Address**: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

### Destination Chains

| Network | Chain ID | CCIP Selector | USDC Address |
|---------|----------|---------------|--------------|
| **Arbitrum Sepolia** | 421614 | 3478487238524512106 | `0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d` |
| **Optimism Sepolia** | 11155420 | 5224473277236331295 | `0x5fd84259d66Cd46123540766Be93DFE6D43130D7` |
| **Polygon Amoy** | 80002 | 16281711391670634445 | `0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582` |

## 🔧 Smart Contract Functions

### Main Transfer Function
```solidity
function transferUsdc(
    uint64 _destinationChainSelector,
    address _receiver,
    uint256 _amount
) external returns (bytes32 messageId)
```

### Utility Functions
- `getFee(chainSelector, receiver, amount)`: Estimate transfer cost
- `balancesOf(account)`: Check LINK and USDC balances
- `isChainSupported(chainSelector)`: Verify supported chains
- `getSupportedChains()`: List all supported destinations

### Owner Functions (Contract Deployer Only)
- `addSupportedChain(chainSelector)`: Add new destination
- `removeSupportedChain(chainSelector)`: Remove destination
- `withdrawToken(beneficiary, token)`: Withdraw contract funds

## 💻 Frontend Architecture

### Component Structure
```
app/
├── components/
│   ├── BridgeInterface.tsx    # Main bridge component
│   ├── NavHeader.tsx          # Navigation header
│   └── ui/                    # Reusable UI components
├── context/                   # React context providers
├── hooks/                     # Custom React hooks
├── services/                  # API and external services
├── utils/                     # Utility functions
├── Loading.tsx                # CCIP-themed loading animations
├── loading.css                # Advanced CSS animations
└── cxChainTr/page.jsx        # Main bridge page
```

### Key Features Implementation

#### Loading Animations
- **Chain Animation**: Animated chain links representing CCIP
- **Pulse Animation**: Smooth pulsing dots for processing states
- **Circle Animation**: Traditional spinner with gradient effects

#### State Management
- **Transaction States**: Idle, validation, signing, processing, completed
- **Wallet States**: Disconnected, connecting, connected
- **Network States**: Correct network, wrong network, switching

#### Event Parsing System
- **Priority 1**: Standard CCIP Router events (`CCIPSendRequested`)
- **Priority 2**: Custom contract events (`UsdcTransferred`)
- **Priority 3**: Common CCIP events (`MessageSent`)
- **Priority 4**: CCIP-related patterns (`CCIPSend`, `CCIPMessage`)
- **Priority 5**: Deep scan of raw event data and topics arrays

## 💰 Cost Structure

### User Costs (Per Transfer)
- **Source Gas**: ~0.001-0.005 ETH on Sepolia
- **CCIP Fee**: ~0.5-2 LINK (paid by contract, funded by owner)

### Contract Owner Costs
- **Deployment**: ~0.01-0.02 ETH
- **LINK Funding**: Ongoing, depends on usage volume

## 🧪 Testing Checklist

- [ ] Contract deployed successfully on Sepolia
- [ ] Contract funded with LINK tokens
- [ ] Frontend updated with correct contract address
- [ ] Interface loads without wallet connection required
- [ ] MetaMask connection works smoothly
- [ ] USDC approval system functions correctly
- [ ] Transfer progress tracking works
- [ ] Success screen displays transaction hash and CCIP message ID
- [ ] CCIP Explorer integration works
- [ ] Small test transfer (0.1 USDC) completed
- [ ] Transfer confirmed on destination chain

## 🔍 Troubleshooting

### Contract Deployment Issues
- **Out of Gas**: Increase gas limit in MetaMask
- **Invalid Parameters**: Double-check constructor addresses
- **Compilation Error**: Ensure Solidity 0.8.19 is selected

### Transfer Issues
- **"NotEnoughBalanceForFees"**: Fund contract with more LINK
- **"NotEnoughBalanceUsdcForTransfer"**: Check your USDC balance
- **"UnsupportedDestinationChain"**: Verify chain selector
- **Transaction Stuck**: Check Sepolia network congestion

### Frontend Issues
- **Wrong Network**: Switch MetaMask to Ethereum Sepolia
- **Contract Not Found**: Verify contract address in code
- **RPC Errors**: Try refreshing or switching RPC endpoints
- **Loading Issues**: Clear browser cache and restart

### Common Fixes
1. **Clear MetaMask Activity**: Settings → Advanced → Clear activity tab data
2. **Reset MetaMask Account**: Settings → Advanced → Reset account
3. **Check Gas Settings**: Use "Fast" gas option for quicker confirmations
4. **Refresh Application**: Hard refresh (Ctrl+F5) to clear cache

## 📚 Resources

- **Chainlink CCIP Docs**: [docs.chain.link/ccip](https://docs.chain.link/ccip)
- **CCIP Directory**: [ccipdirectory.com](https://ccipdirectory.com/)
- **CCIP Explorer**: [ccip.chain.link](https://ccip.chain.link/)
- **Chainlink Faucet**: [faucets.chain.link](https://faucets.chain.link/)
- **Remix IDE**: [remix.ethereum.org](https://remix.ethereum.org)

## 🎯 User Flow Summary

1. **Browse**: User can explore interface without wallet connection
2. **Connect**: Optional wallet connection when ready to transact
3. **Network**: Automatic network detection and switching prompts
4. **Balance**: Real-time balance and allowance checking
5. **Approve**: One-time USDC approval with progress feedback
6. **Transfer**: Intuitive transfer form with validation
7. **Progress**: Real-time progress tracking through all steps
8. **Success**: Professional completion screen with all details
9. **Track**: Direct CCIP Explorer integration for monitoring

## 🎨 Design Features

### Visual Elements
- **Glass-morphism**: Modern frosted glass effects
- **Gradient Borders**: Smooth color transitions
- **Animated States**: Loading, success, and error animations
- **Responsive Grid**: Mobile-first responsive design

### User Experience
- **Non-intrusive**: No forced wallet connections
- **Progressive**: Information revealed as needed
- **Accessible**: Clear visual hierarchy and feedback
- **Professional**: Consistent with modern DeFi interfaces

## ⚠️ Important Notes

- **Testnet Only**: This setup is for testing purposes only
- **LINK Funding**: Contract owner must maintain LINK balance
- **Rate Limits**: Public RPCs may have usage limitations
- **Transaction Time**: Cross-chain transfers take 2-20 minutes
- **Security**: Smart contract is unaudited - use at your own risk
- **Browser Support**: Requires modern browser with MetaMask extension

## 🔄 Recent Updates

### v2.0 Features
- ✅ Modern glass-morphism UI design
- ✅ Passive wallet connection (no forced connections)
- ✅ CCIP-themed loading animations
- ✅ Real-time transaction progress tracking
- ✅ Advanced CCIP message ID extraction
- ✅ Professional success screen with CCIP Explorer integration
- ✅ Comprehensive error handling and user feedback
- ✅ Mobile-responsive interface
- ✅ Visual transaction state management

---

**Built with Chainlink CCIP for secure, reliable cross-chain transfers** 🌉