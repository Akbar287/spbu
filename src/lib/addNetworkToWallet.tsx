
import { sepolia } from "wagmi/chains";
import { ganache } from "../config/wagmi";
import { besuPrivate } from "../config/wagmi";

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

export async function addGanacheToWallet() {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return false;

    try {
        await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
                {
                    chainId: `0x${ganache.id.toString(16)}`,
                    chainName: "Ganache Local",
                    rpcUrls: ["http://127.0.0.1:7545"],
                    nativeCurrency: {
                        name: "Ether",
                        symbol: "ETH",
                        decimals: 18,
                    },
                },
            ],
        });
        return true;
    } catch (err) {
        // User rejected or error occurred
        return false;
    }
}

export async function addBesuToWallet() {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return false;

    try {
        await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
                {
                    chainId: `0x${besuPrivate.id.toString(16)}`,
                    chainName: "Besu Private Network",
                    rpcUrls: ["http://43.163.104.18"],
                    nativeCurrency: {
                        name: "Ether",
                        symbol: "ETH",
                        decimals: 18,
                    },
                },
            ],
        });
        return true;
    } catch (err) {
        // User rejected or error occurred
        return false;
    }
}