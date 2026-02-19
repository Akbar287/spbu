
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createPublicClient, createWalletClient, http, keccak256, toBytes, defineChain } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
const deploymentFile = path.join(__dirname, '../deployments/sepolia.json');
if (!fs.existsSync(deploymentFile)) {
    throw new Error(`Deployment file not found: ${deploymentFile}`);
}
const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
const DIAMOND_ADDRESS = deploymentData.contracts.MAIN_DIAMOND;

const sepolia = defineChain({
    id: 11155111,
    name: 'Sepolia',
    nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
    rpcUrls: { default: { http: [RPC_URL] } },
});

// Minimal ABI
const ABI = [
    {
        "inputs": [],
        "name": "accessControlStorage",
        "outputs": [
            {
                "components": [
                    {
                        "name": "roles",
                        "type": "mapping(bytes32 => mapping(address => bool))"
                    }
                ],
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "name": "account", "type": "address" }],
        "name": "setupDefaultAdmin",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "_namaStatus", "type": "string" }, { "name": "_keterangan", "type": "string" }],
        "name": "createStatusMember",
        "outputs": [{ "name": "", "type": "uint256" }],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "name": "role", "type": "bytes32" }, { "name": "account", "type": "address" }],
        "name": "hasRole",
        "outputs": [{ "name": "", "type": "bool" }],
        "stateMutability": "view",
        "type": "function"
    }
];

async function main() {
    const roleHash = keccak256(toBytes("ADMIN_ROLE"));
    console.log("Network: Sepolia");
    console.log("RPC URL:", RPC_URL);
    console.log("Diamond:", DIAMOND_ADDRESS);
    console.log("ADMIN_ROLE Hash:", roleHash);

    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) throw new Error("No private key");

    const account = privateKeyToAccount(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`);

    const client = createPublicClient({
        chain: sepolia,
        transport: http(RPC_URL)
    });

    const wallet = createWalletClient({
        account,
        chain: sepolia,
        transport: http(RPC_URL)
    });

    console.log("Checking Admin Role for:", account.address);
    try {
        const isAdmin = await client.readContract({
            address: DIAMOND_ADDRESS,
            abi: ABI,
            functionName: 'hasRole',
            args: [roleHash, account.address]
        });
        console.log("Has Admin Role:", isAdmin);

        if (!isAdmin) {
            console.log("Attempting setupDefaultAdmin...");
            try {
                const hash = await wallet.writeContract({
                    address: DIAMOND_ADDRESS,
                    abi: ABI,
                    functionName: 'setupDefaultAdmin',
                    args: [account.address]
                });
                await client.waitForTransactionReceipt({ hash });
                console.log("setupDefaultAdmin success.");
            } catch (e) {
                console.error("setupDefaultAdmin failed:", e.message);
                if (e.cause) console.error("Cause:", e.cause);
            }
        }

        console.log("Attempting createStatusMember...");
        try {
            const hash = await wallet.writeContract({
                address: DIAMOND_ADDRESS,
                abi: ABI,
                functionName: 'createStatusMember',
                args: ["TestStatus", "TestKet"]
            });
            console.log("Transaction sent:", hash);
            const receipt = await client.waitForTransactionReceipt({ hash });
            console.log("createStatusMember success! Block:", receipt.blockNumber);
        } catch (e) {
            console.error("createStatusMember failed:", e.message);
            if (e.cause) console.error("Cause:", e.cause);
        }

    } catch (e) {
        console.error("General Error:", e);
        if (e.cause) console.error("Cause:", e.cause);
    }
}

main();
