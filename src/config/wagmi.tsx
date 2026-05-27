import { createConfig, http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { fallback } from 'viem'

const sepoliaRpcUrl = process.env.REACT_APP_SEPOLIA_RPC_URL
const defaultSepoliaRpc = 'https://rpc.sepolia.org'
const backupSepoliaRpcs = [
    'https://ethereum-sepolia-rpc.publicnode.com',
    'https://sepolia.drpc.org',
]
const sepoliaRpcCandidates = [sepoliaRpcUrl, defaultSepoliaRpc, ...backupSepoliaRpcs].filter(
    (url): url is string => typeof url === 'string' && url.length > 0,
)
const sepoliaTransports = sepoliaRpcCandidates.map((url) =>
    http(url, {
        timeout: 15_000,
        retryCount: 1,
    }),
)

/**
 * Wagmi configuration locked to Ethereum Sepolia.
 */
export const config = createConfig({
    chains: [sepolia],
    transports: {
        [sepolia.id]:
            sepoliaTransports.length > 1
                ? fallback(sepoliaTransports, { rank: true })
                : sepoliaTransports[0],
    },
})

export { sepolia as localChain }
