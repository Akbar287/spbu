/**
 * Deploy All Contracts Script (Diamond Pattern)
 * Hardhat 3.x Compatible with Viem
 * 
 * Usage:
 *   Ganache:  npx hardhat run scripts/deploy.js --network ganache
 * 
 * Set environment variable DEPLOYER_PRIVATE_KEY with Ganache account private key
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

// Define Ganache chain (default Ganache CLI uses 1337)
const ganache = defineChain({
    id: 1337,
    name: 'Ganache',
    nativeCurrency: { decimals: 18, name: 'Ether', symbol: 'ETH' },
    rpcUrls: { default: { http: ['http://127.0.0.1:7545'] } },
});

async function main() {
    console.log("🚀 Starting SPBU Diamond Contract Deployment...\n");

    // Check for private key
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
        console.error("❌ Error: DEPLOYER_PRIVATE_KEY not set in environment");
        console.log("\n💡 To fix, set your Ganache account private key:");
        console.log("   1. Open Ganache GUI");
        console.log("   2. Click the key icon next to the first account");
        console.log("   3. Copy the private key");
        console.log("   4. Add to .env file: DEPLOYER_PRIVATE_KEY=0x...");
        console.log("   5. Or run: DEPLOYER_PRIVATE_KEY=0x... npx hardhat run scripts/deploy.js --network ganache");
        process.exit(1);
    }

    // Ensure private key has 0x prefix
    const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;

    console.log(`📡 Network: ganache`);
    console.log(`⛓️  Chain ID: 5777\n`);

    // Create viem clients
    const transport = http('http://127.0.0.1:7545');
    const publicClient = createPublicClient({
        chain: ganache,
        transport,
    });

    const account = privateKeyToAccount(formattedKey);
    const walletClient = createWalletClient({
        account,
        chain: ganache,
        transport,
    });

    console.log(`👤 Deployer: ${account.address}`);
    const balance = await publicClient.getBalance({ address: account.address });
    console.log(`💰 Balance: ${Number(balance) / 1e18} ETH\n`);

    if (balance === 0n) {
        console.error("❌ Error: Deployer account has no ETH");
        console.log("   Make sure Ganache is running and the private key matches an account with ETH");
        process.exit(1);
    }

    // Object to store deployed addresses
    const deployedAddresses = {};

    // Helper function to deploy contract
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
        });

        const receipt = await publicClient.waitForTransactionReceipt({ hash });
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
        "AccessControlFacet",
        // Split IdentityFacet into 2 smaller facets
        "IdentityMemberFacet",
        "IdentityNotifFacet",
        "OrganizationFacet",
        "HumanCapitalFacet",
        // Split AssetFacet into 2 smaller facets
        "AssetCoreFacet",
        "AssetFileFacet",
        // Split InventoryFacet into 3 smaller facets
        "InventoryCoreFacet",
        "InventoryDocsFacet",
        "InventoryTransferFacet",
        // Split LogisticFacet into 2 smaller facets
        "LogisticCoreFacet",
        "LogisticFileFacet",
        // Split AttendanceFacet into 2 smaller facets
        "AttendanceConfigFacet",
        "AttendanceRecordFacet",
        // Split PengadaanFacet into 2 smaller facets
        "PengadaanCoreFacet",
        "PengadaanPaymentFacet",
        // Split PointOfSalesFacet into 2 smaller facets
        "PointOfSalesCoreFacet",
        "PointOfSalesSalesFacet",
        "FinanceFacet",
        "QualityControlFacet",
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

    const deploymentFile = path.join(deploymentsDir, "ganache.json");
    const deploymentData = {
        network: "ganache",
        chainId: 5777,
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
