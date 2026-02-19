import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'

/**
 * Wagmi configuration locked to Ethereum Sepolia.
 */
export const config = createConfig({
    chains: [sepolia],
    transports: {
        [sepolia.id]: http('https://rpc.sepolia.org'),
    },
})

export { sepolia as localChain }
