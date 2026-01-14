/**
 * Deploy All Contracts Script (Diamond Pattern)
 * Hardhat 3.x Compatible with Viem
 * 
 * Usage:
 *   Besu:  npx hardhat run scripts/deploy.js --network besu
 * 
 * Set environment variable DEPLOYER_PRIVATE_KEY with Besu account private key
 */

import hardhat from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";
import dotenv from "dotenv";

// Load .env file
dotenv.config();

// ES Module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Define Sepolia chain
const sepoliaChain = defineChain({
    id: 11155111,
    name: 'Sepolia',
    nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
    rpcUrls: {
        default: { http: [process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'] },
    },
});

const besuPrivate = defineChain({
    id: 287287,
    name: 'Besu IBFT Private',
    nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
    rpcUrls: {
        default: { http: [process.env.BESU_RPC_URL || 'https://akbar-kece.duckdns.org/'] },
    },
});

// Define Ganache chain
const ganache = defineChain({
    id: 1337,
    name: 'Ganache',
    nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
    rpcUrls: { default: { http: ['http://127.0.0.1:7545'] } },
});

// Network configurations map
const NETWORKS = {
    sepolia: sepoliaChain,
    besu: besuPrivate,
    ganache: ganache,
};

async function main() {
    console.log("🚀 Starting SPBU Diamond Contract Deployment...\n");

    // Check for private key
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
        console.error("❌ Error: DEPLOYER_PRIVATE_KEY not set in environment");
        console.log("\n💡 Add to .env file: DEPLOYER_PRIVATE_KEY=0x...");
        process.exit(1);
    }

    // Ensure private key has 0x prefix
    const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

    // Detect network from hardhat runtime environment
    const networkName = hardhat.network?.name || 'besu';
    const activeChain = NETWORKS[networkName] || besuPrivate;
    const rpcUrl = activeChain.rpcUrls.default.http[0];

    console.log(`📡 Network: ${networkName}`);
    console.log(`🔗 RPC URL: ${rpcUrl}`);
    console.log(`⛓️  Chain ID: ${activeChain.id}\n`);

    // Create viem clients
    const transport = http(rpcUrl);
    const publicClient = createPublicClient({
        chain: activeChain,
        transport,
    });

    const account = privateKeyToAccount(formattedKey);
    const walletClient = createWalletClient({
        account,
        chain: activeChain,
        transport,
    });

    console.log(`👤 Deployer: ${account.address}`);
    const balance = await publicClient.getBalance({ address: account.address });
    console.log(`💰 Balance: ${Number(balance) / 1e18} ETH\n`);

    if (balance === 0n) {
        console.error("❌ Error: Deployer account has no ETH");
        console.log(`   Make sure the account has ETH on ${networkName}`);
        process.exit(1);
    }

    // Object to store deployed addresses
    const deployedAddresses = {};

    // Get initial nonce
    let currentNonce = await publicClient.getTransactionCount({ address: account.address });
    console.log(`🔢 Starting nonce: ${currentNonce}\n`);

    // Helper function to deploy contract with explicit nonce
    async function deployContract(contractName) {
        const artifact = await hardhat.artifacts.readArtifact(contractName);

        // Ensure bytecode has 0x prefix
        const bytecode = artifact.bytecode.startsWith('0x')
            ? artifact.bytecode
            : `0x${artifact.bytecode}`;

        const hash = await walletClient.deployContract({
            abi: artifact.abi,
            bytecode: bytecode,
            account,
            nonce: currentNonce,
        });

        // Increment nonce for next transaction
        currentNonce++;

        const receipt = await publicClient.waitForTransactionReceipt({
            hash,
            timeout: 60_000, // 60 seconds - enough for ~30 blocks at 2s/block
            pollingInterval: 2_000, // Poll every 2s (matches block time)
        });
        return receipt.contractAddress;
    }

    // ==========================================================================
    // Deploy MainDiamond
    // ==========================================================================
    console.log("1️⃣  Deploying MainDiamond (Diamond Proxy)...");
    try {
        const address = await deployContract("MainDiamond");
        deployedAddresses.MAIN_DIAMOND = address;
        console.log(`   ✅ MainDiamond: ${address}\n`);
    } catch (error) {
        console.error("❌ Failed to deploy MainDiamond:", error.message);
        process.exit(1);
    }

    // ==========================================================================
    // Deploy All Facets
    // ==========================================================================
    const facets = [
        'AccessControlFacet',
        'AssetCoreFacet',
        'AssetFileFacet',
        'AttendanceConfigFacet',
        'AttendanceRecordFacet',
        'CmsFacet',
        'FinanceFacet',
        'HumanCapitalFacet',
        'IdentityMemberFacet',
        'IdentityNotifFacet',
        'InventoryCoreFacet',
        'InventoryDocsFacet',
        'InventoryTransferFacet',
        'LogisticCoreFacet',
        'LogisticFileFacet',
        'OrganizationFacet',
        'PengadaanConfirmationFacet',
        'PengadaanCoreFacet',
        'PengadaanPaymentFacet',
        'PointOfSalesCoreFacet',
        'PointOfSalesSalesFacet',
        'QualityControlFacet',
        'ViewFacet',
    ];

    let facetNum = 2;
    for (const facetName of facets) {
        console.log(`${facetNum}️⃣  Deploying ${facetName}...`);
        try {
            const address = await deployContract(facetName);
            const key = facetName.toUpperCase().replace('FACET', '_FACET');
            deployedAddresses[key] = address;
            console.log(`   ✅ ${facetName}: ${address}\n`);
        } catch (error) {
            console.log(`   ⚠️  ${facetName}: Skipped (${error.message})\n`);
        }
        facetNum++;
    }

    // ==========================================================================
    // Save deployment addresses
    // ==========================================================================
    console.log("📁 Saving deployment addresses...\n");

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, "besu.json");
    const deploymentData = {
        network: "besu",
        chainId: 287287,
        deployer: account.address,
        deployedAt: new Date().toISOString(),
        contracts: deployedAddresses,
    };

    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));
    console.log(`   📄 Saved to: ${deploymentFile}\n`);

    // ==========================================================================
    // Summary
    // ==========================================================================
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("                    🎉 DEPLOYMENT COMPLETE!                     ");
    console.log("═══════════════════════════════════════════════════════════════\n");

    console.log("📋 Deployed Contracts:\n");
    for (const [key, address] of Object.entries(deployedAddresses)) {
        console.log(`   ${key}: ${address}`);
    }

    console.log("\n═══════════════════════════════════════════════════════════════");

    return deployedAddresses;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });
