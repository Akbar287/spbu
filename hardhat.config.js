import { defineConfig } from "hardhat/config";

// Load environment variables
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

export default defineConfig({
    solidity: {
        version: "0.8.33",
        settings: {
            evmVersion: "paris", // Avoid PUSH0 opcode not supported by Ganache
            viaIR: true,
            optimizer: {
                enabled: true,
                runs: 1,
            },
        },
    },

    networks: {
        // Ganache GUI (Port 7545)
        ganache: {
            type: "http",
            url: "http://127.0.0.1:7545",
            chainId: 1337,
            accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : [],
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

    defaultNetwork: "ganache",
});