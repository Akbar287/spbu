import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'

const sepoliaRpcUrl = process.env.REACT_APP_SEPOLIA_RPC_URL

/**
 * Wagmi configuration locked to Ethereum Sepolia.
 */
export const config = createConfig({
    chains: [sepolia],
    transports: {
        [sepolia.id]: http(sepoliaRpcUrl),
    },
})

export { sepolia as localChain }
