import { defineConfig } from "hardhat/config";

// Load environment variables
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

export default defineConfig({
    solidity: {
        version: "0.8.33",
        settings: {
            evmVersion: "paris",
            viaIR: true,
            optimizer: {
                enabled: true,
                runs: 1,
            },
        },
    },

    networks: {
        sepolia: {
            type: "http",
            url: process.env.REACT_APP_SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
            chainId: 11155111,
            accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
            gas: 6000000,
            timeout: 120000,
        },
        localhost: {
            type: "http",
            url: "http://127.0.0.1:8545",
            chainId: 31337,
        },

        hardhat: {
            type: "edr-simulated",
            chainId: 31337,
        },
    },

    defaultNetwork: "sepolia",
});
