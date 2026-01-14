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

export const besuPrivate = defineChain({
    id: 287287,
    name: 'Besu IBFT Private',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: { http: ['https://akbar-kece.duckdns.org/'] },
    },
    blockExplorers: undefined,
});


/**
 * Wagmi Configuration for SPBU Management System
 * 
 * Chains:
 * - besuPrivate: Besu IBFT Private Network (chainId: 287287) - PRIMARY
 * - ganache: Ganache GUI Local Development (chainId: 1337)
 * - sepolia: Ethereum Sepolia Testnet (chainId: 11155111)
 * - mainnet: Ethereum Mainnet (chainId: 1)
 */
export const config = createConfig({
    chains: [besuPrivate, ganache, sepolia, mainnet],
    transports: {
        [besuPrivate.id]: http('https://akbar-kece.duckdns.org/'),
        [ganache.id]: http('http://127.0.0.1:7545'),
        [sepolia.id]: http(),
        [mainnet.id]: http(),
    },
})

// Export besuPrivate chain as localChain for primary usage
export { besuPrivate as localChain }