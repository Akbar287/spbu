import { createConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { defineChain } from 'viem'

/**
 * Custom Ganache Chain Definition
 * - URL: http://127.0.0.1:7545
 * - Chain ID: 5777
 * - Network ID: 5777
 */
export const ganache = defineChain({
    id: 1337,
    name: 'Ganache',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: ['http://127.0.0.1:7545'],
        },
    },
    blockExplorers: {
        default: { name: 'Ganache', url: '' },
    },
    testnet: true,
})

/**
 * Wagmi Configuration for SPBU Management System
 * 
 * Chains:
 * - ganache: Ganache GUI Local Development (chainId: 5777, port: 7545)
 * - sepolia: Ethereum Sepolia Testnet (chainId: 11155111)
 * - mainnet: Ethereum Mainnet (chainId: 1)
 * 
 * For local development with Ganache:
 * 1. Open Ganache GUI and create/open workspace
 * 2. Ensure RPC Server is running on http://127.0.0.1:7545
 * 3. Import Ganache accounts into MetaMask using private keys
 * 4. Add custom network in MetaMask:
 *    - Network Name: Ganache
 *    - RPC URL: http://127.0.0.1:7545
 *    - Chain ID: 5777
 *    - Currency Symbol: ETH
 * 5. Run `npx hardhat run scripts/deploy.js --network ganache` to deploy contracts
 * 
 * First Ganache Account: 0x92672Af75e2DB408CAAc0DFc3cd7a74e3938b7bb
 */
export const config = createConfig({
    chains: [ganache, sepolia, mainnet],
    transports: {
        [ganache.id]: http('http://127.0.0.1:7545'),
        [sepolia.id]: http(),
        [mainnet.id]: http(),
    },
})

// Export ganache chain for use in other components
export { ganache as localChain }