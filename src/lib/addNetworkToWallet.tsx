
import { sepolia } from "wagmi/chains";

export async function addSepoliaToWallet() {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return false;

    try {
        await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
                {
                    chainId: `0x${sepolia.id.toString(16)}`,
                    chainName: "Sepolia Testnet",
                    rpcUrls: ["https://rpc.sepolia.org"],
                    nativeCurrency: {
                        name: "Sepolia ETH",
                        symbol: "ETH",
                        decimals: 18,
                    },
                    blockExplorerUrls: ["https://sepolia.etherscan.io"],
                },
            ],
        });
        return true;
    } catch (err) {
        // User rejected or error occurred
        return false;
    }
}
