# CCIP USDC Bridge - Complete Setup Guide

A simplified cross-chain USDC bridge using Chainlink CCIP. Transfer USDC from Ethereum Sepolia to Arbitrum, Optimism, and Polygon testnets using Remix IDE for deployment.

## 🚀 Quick Overview

- **Frontend**: Next.js with simple MetaMask integration
- **Smart Contract**: CCIP-enabled bridge supporting multiple destination chains
- **Deployment**: Remix IDE only (no complex Hardhat setup)
- **Networks**: Ethereum Sepolia → Arbitrum, Optimism, Polygon testnets

## 📋 Prerequisites

- **MetaMask**: Browser extension installed
- **Testnet ETH**: For gas fees on Ethereum Sepolia
- **Testnet USDC**: For transfers
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
In `/app/cxChainTr/page.jsx`, update line 17:
```javascript
contractAddress: 'YOUR_DEPLOYED_CONTRACT_ADDRESS_HERE',
```
Replace with the address from Remix deployment.

#### 3.3 Start Application
```bash
npm run dev
```
Visit [http://localhost:3000](http://localhost:3000)

### Step 4: Test the Bridge

#### 4.1 Connect Wallet
1. Click "Connect MetaMask"
2. Ensure you're on Ethereum Sepolia network

#### 4.2 Approve USDC Spending
Before transferring, you need to approve the contract to spend your USDC:
1. Go to [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238#writeContract)
2. Connect your wallet
3. Call `approve` function:
   - **spender**: Your deployed contract address
   - **amount**: `1000000000000` (allows 1M USDC transfers)

#### 4.3 Perform Test Transfer
1. Select destination chain (Arbitrum, Optimism, or Polygon)
2. Enter receiver address (can be your own address)
3. Enter amount (start with 0.1 USDC)
4. Click "Transfer USDC"
5. Confirm transaction in MetaMask

#### 4.4 Monitor Transfer
- Transaction takes 2-20 minutes to complete
- Track progress at [CCIP Explorer](https://ccip.chain.link/)
- Use the transaction hash from MetaMask

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

## 💰 Cost Structure

### User Costs (Per Transfer)
- **Source Gas**: ~0.001-0.005 ETH on Sepolia
- **CCIP Fee**: ~0.5-2 LINK (paid by contract, funded by owner)

### Contract Owner Costs
- **Deployment**: ~0.01-0.02 ETH
- **LINK Funding**: Ongoing, depends on usage volume

## 📁 Project Structure

```
ccip-usdc-bridge/
├── app/                    # Next.js frontend
│   ├── cxChainTr/         
│   │   ├── page.jsx       # Main bridge interface
│   │   └── abi.json       # Contract ABI
│   ├── layout.tsx         # App layout
│   ├── page.tsx           # Home page with wallet connection
│   └── ...                # Other frontend components
├── contracts/             
│   └── CCIPUSDCBridge.sol # Smart contract for Remix
├── README.md              # This comprehensive guide
└── package.json           # Frontend dependencies
```

## 🧪 Testing Checklist

- [ ] Contract deployed successfully on Sepolia
- [ ] Contract funded with LINK tokens
- [ ] Frontend updated with correct contract address
- [ ] MetaMask connected to Sepolia
- [ ] USDC approval granted to contract
- [ ] Small test transfer (0.1 USDC) completed
- [ ] Transfer confirmed on destination chain
- [ ] CCIP Explorer shows successful transaction

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

### Common Fixes
1. **Clear MetaMask Activity**: Settings → Advanced → Clear activity tab data
2. **Reset MetaMask Account**: Settings → Advanced → Reset account
3. **Check Gas Settings**: Use "Fast" gas option for quicker confirmations

## 📚 Resources

- **Chainlink CCIP Docs**: [docs.chain.link/ccip](https://docs.chain.link/ccip)
- **CCIP Directory**: [ccipdirectory.com](https://ccipdirectory.com/)
- **CCIP Explorer**: [ccip.chain.link](https://ccip.chain.link/)
- **Chainlink Faucet**: [faucets.chain.link](https://faucets.chain.link/)
- **Remix IDE**: [remix.ethereum.org](https://remix.ethereum.org)

## 🎯 User Flow Summary

1. **Setup**: Deploy contract via Remix, fund with LINK
2. **Configure**: Update frontend with contract address
3. **Connect**: User connects MetaMask wallet
4. **Approve**: User approves USDC spending (one-time)
5. **Transfer**: User selects destination and amount
6. **Execute**: Single transaction handles entire cross-chain transfer
7. **Monitor**: Track progress via CCIP Explorer
8. **Complete**: USDC arrives on destination chain (2-20 minutes)

## ⚠️ Important Notes

- **Testnet Only**: This setup is for testing purposes only
- **LINK Funding**: Contract owner must maintain LINK balance
- **Rate Limits**: Public RPCs may have usage limitations
- **Transaction Time**: Cross-chain transfers are not instant
- **Security**: Smart contract is unaudited - use at your own risk

---

**Built with Chainlink CCIP for secure, reliable cross-chain transfers** 🌉