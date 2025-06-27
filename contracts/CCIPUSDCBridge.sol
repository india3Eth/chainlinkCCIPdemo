// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {IRouterClient} from "@chainlink/contracts-ccip/src/v0.8/ccip/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts-ccip/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/src/v0.8/ccip/libraries/Client.sol";
import {LinkTokenInterface} from "@chainlink/contracts/src/v0.8/interfaces/LinkTokenInterface.sol";
import {IERC20} from "@chainlink/contracts-ccip/src/v0.8/vendor/openzeppelin-solidity/v4.8.0/contracts/token/ERC20/IERC20.sol";

/**
 * @title CCIPUSDCBridge
 * @author Chainlink CCIP Demo
 * @notice A smart contract for cross-chain USDC transfers using Chainlink CCIP
 * @dev This contract allows users to transfer USDC from Ethereum Sepolia to multiple destination chains
 */
contract CCIPUSDCBridge is OwnerIsCreator {
    // Custom errors for gas-efficient reverts
    error NotEnoughBalanceForFees(uint256 currentBalance, uint256 calculatedFees);
    error NotEnoughBalanceUsdcForTransfer(uint256 currentBalance, uint256 transferAmount);
    error NothingToWithdraw();
    error UnsupportedDestinationChain(uint64 destinationChainSelector);
    error InvalidReceiver();
    error InvalidAmount();

    // Events for tracking transfers
    event UsdcTransferred(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address indexed receiver,
        uint256 amount,
        uint256 ccipFee
    );

    // CCIP Router interface
    IRouterClient private s_router;
    
    // Token interfaces
    LinkTokenInterface private s_linkToken;
    IERC20 private s_usdcToken;

    // Supported destination chains mapping
    mapping(uint64 => bool) public supportedDestinations;
    
    // Chain selectors for supported networks
    uint64 public constant ARBITRUM_SEPOLIA_CHAIN_SELECTOR = 3478487238524512106;
    uint64 public constant OPTIMISM_SEPOLIA_CHAIN_SELECTOR = 5224473277236331295;
    uint64 public constant POLYGON_AMOY_CHAIN_SELECTOR = 16281711391670634445;

    /**
     * @notice Constructor initializes the contract with CCIP Router, LINK and USDC token addresses
     * @param _router The address of the CCIP Router contract
     * @param _link The address of the LINK token contract
     * @param _usdc The address of the USDC token contract
     */
    constructor(address _router, address _link, address _usdc) {
        s_router = IRouterClient(_router);
        s_linkToken = LinkTokenInterface(_link);
        s_usdcToken = IERC20(_usdc);
        
        // Initialize supported destination chains
        supportedDestinations[ARBITRUM_SEPOLIA_CHAIN_SELECTOR] = true;
        supportedDestinations[OPTIMISM_SEPOLIA_CHAIN_SELECTOR] = true;
        supportedDestinations[POLYGON_AMOY_CHAIN_SELECTOR] = true;
    }

    /**
     * @notice Transfer USDC to a specified destination chain
     * @param _destinationChainSelector The selector of the destination blockchain
     * @param _receiver The address of the recipient on the destination blockchain
     * @param _amount The amount of USDC to transfer (in wei, 6 decimals for USDC)
     * @return messageId The unique identifier of the CCIP message
     */
    function transferUsdc(
        uint64 _destinationChainSelector,
        address _receiver,
        uint256 _amount
    ) external returns (bytes32 messageId) {
        // Input validation
        if (!supportedDestinations[_destinationChainSelector]) {
            revert UnsupportedDestinationChain(_destinationChainSelector);
        }
        if (_receiver == address(0)) {
            revert InvalidReceiver();
        }
        if (_amount == 0) {
            revert InvalidAmount();
        }

        // Check if user has sufficient USDC balance
        uint256 userUsdcBalance = s_usdcToken.balanceOf(msg.sender);
        if (userUsdcBalance < _amount) {
            revert NotEnoughBalanceUsdcForTransfer(userUsdcBalance, _amount);
        }

        // Create an EVM2AnyMessage struct for the cross-chain transfer
        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            _receiver,
            _amount,
            address(s_linkToken) // Pay fees in LINK
        );

        // Get the fee required to send the CCIP message
        uint256 fees = s_router.getFee(_destinationChainSelector, evm2AnyMessage);

        // Check if the contract has sufficient LINK balance for fees
        uint256 linkBalance = s_linkToken.balanceOf(address(this));
        if (fees > linkBalance) {
            revert NotEnoughBalanceForFees(linkBalance, fees);
        }

        // Transfer USDC from user to this contract
        s_usdcToken.transferFrom(msg.sender, address(this), _amount);

        // Approve the Router to transfer LINK tokens on contract's behalf for fees
        s_linkToken.approve(address(s_router), fees);

        // Approve the Router to spend USDC tokens on contract's behalf for the transfer
        s_usdcToken.approve(address(s_router), _amount);

        // Send the CCIP message through the router and store the returned message ID
        messageId = s_router.ccipSend(_destinationChainSelector, evm2AnyMessage);

        // Emit an event with message details
        emit UsdcTransferred(
            messageId,
            _destinationChainSelector,
            _receiver,
            _amount,
            fees
        );

        return messageId;
    }

    /**
     * @notice Construct a CCIP message
     * @param _receiver The address of the recipient
     * @param _amount The amount of USDC to transfer
     * @param _feeTokenAddress The address of the token used for fees
     * @return Client.EVM2AnyMessage The CCIP message
     */
    function _buildCCIPMessage(
        address _receiver,
        uint256 _amount,
        address _feeTokenAddress
    ) private view returns (Client.EVM2AnyMessage memory) {
        // Set the token amounts
        Client.EVMTokenAmount[] memory tokenAmounts = new Client.EVMTokenAmount[](1);
        tokenAmounts[0] = Client.EVMTokenAmount({
            token: address(s_usdcToken),
            amount: _amount
        });

        // Create an EVM2AnyMessage struct
        return Client.EVM2AnyMessage({
            receiver: abi.encode(_receiver), // ABI-encoded receiver address
            data: "", // No additional data
            tokenAmounts: tokenAmounts, // The amount and type of token being transferred
            extraArgs: Client._argsToBytes(
                // Additional arguments, setting gas limit
                Client.EVMExtraArgsV1({gasLimit: 200_000})
            ),
            // Set the feeToken to a feeTokenAddress, indicating specific asset will be used for fees
            feeToken: _feeTokenAddress
        });
    }

    /**
     * @notice Get fee estimate for a cross-chain transfer
     * @param _destinationChainSelector The selector of the destination blockchain
     * @param _receiver The address of the recipient on the destination blockchain
     * @param _amount The amount of USDC to transfer
     * @return fee The estimated fee in LINK tokens
     */
    function getFee(
        uint64 _destinationChainSelector,
        address _receiver,
        uint256 _amount
    ) external view returns (uint256 fee) {
        if (!supportedDestinations[_destinationChainSelector]) {
            revert UnsupportedDestinationChain(_destinationChainSelector);
        }

        Client.EVM2AnyMessage memory evm2AnyMessage = _buildCCIPMessage(
            _receiver,
            _amount,
            address(s_linkToken)
        );

        return s_router.getFee(_destinationChainSelector, evm2AnyMessage);
    }

    /**
     * @notice Get the balances of LINK and USDC tokens for a given account
     * @param account The address to query balances for
     * @return linkBalance The LINK token balance
     * @return usdcBalance The USDC token balance
     */
    function balancesOf(address account) external view returns (uint256 linkBalance, uint256 usdcBalance) {
        return (s_linkToken.balanceOf(account), s_usdcToken.balanceOf(account));
    }

    /**
     * @notice Get the allowance of USDC tokens from the caller to this contract
     * @return usdcAmount The amount of USDC tokens the contract is allowed to spend
     */
    function allowanceUsdc() external view returns (uint256 usdcAmount) {
        return s_usdcToken.allowance(msg.sender, address(this));
    }

    /**
     * @notice Add support for a new destination chain
     * @param _chainSelector The chain selector to add
     * @dev Only callable by the owner
     */
    function addSupportedChain(uint64 _chainSelector) external onlyOwner {
        supportedDestinations[_chainSelector] = true;
    }

    /**
     * @notice Remove support for a destination chain
     * @param _chainSelector The chain selector to remove
     * @dev Only callable by the owner
     */
    function removeSupportedChain(uint64 _chainSelector) external onlyOwner {
        supportedDestinations[_chainSelector] = false;
    }

    /**
     * @notice Allows the owner to withdraw the entire balance of a specific ERC20 token
     * @param _beneficiary The address to receive the tokens
     * @param _token The contract address of the token to withdraw
     * @dev Only callable by the owner
     */
    function withdrawToken(address _beneficiary, address _token) public onlyOwner {
        uint256 amount = IERC20(_token).balanceOf(address(this));
        if (amount == 0) revert NothingToWithdraw();
        IERC20(_token).transfer(_beneficiary, amount);
    }

    /**
     * @notice Get the list of supported destination chain selectors
     * @return An array of supported chain selectors
     */
    function getSupportedChains() external pure returns (uint64[] memory) {
        uint64[] memory chains = new uint64[](3);
        chains[0] = ARBITRUM_SEPOLIA_CHAIN_SELECTOR;
        chains[1] = OPTIMISM_SEPOLIA_CHAIN_SELECTOR;
        chains[2] = POLYGON_AMOY_CHAIN_SELECTOR;
        return chains;
    }

    /**
     * @notice Check if a destination chain is supported
     * @param _chainSelector The chain selector to check
     * @return Whether the chain is supported
     */
    function isChainSupported(uint64 _chainSelector) external view returns (bool) {
        return supportedDestinations[_chainSelector];
    }
}