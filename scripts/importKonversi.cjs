
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createWalletClient, createPublicClient, http, parseEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// Parse command line arguments
const args = process.argv.slice(2);
const networkArg = args.find(arg => arg.startsWith('--network='));
const NETWORK_NAME = networkArg ? networkArg.split('=')[1] : 'besu';

// RPC URLs by network
const RPC_URLS = {
    besu: process.env.BESU_RPC_URL || 'https://akbar-kece.duckdns.org/',
    sepolia: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
    ganache: 'http://127.0.0.1:7545',
};

const RPC_URL = RPC_URLS[NETWORK_NAME] || RPC_URLS.besu;

// Load deployment file to get Diamond Address
const deploymentPath = path.join(__dirname, `../deployments/${NETWORK_NAME}.json`);
if (!fs.existsSync(deploymentPath)) {
    console.error(`Deployment file not found: ${deploymentPath}`);
    console.error(`Run 'npx hardhat run scripts/deploy.js --network ${NETWORK_NAME}' first.`);
    process.exit(1);
}
const deploymentData = require(deploymentPath);
const DIAMOND_ADDRESS = deploymentData.contracts.MAIN_DIAMOND;

console.log(`📡 Network: ${NETWORK_NAME}`);
console.log(`🔗 RPC URL: ${RPC_URL}`);
console.log(`💎 Diamond: ${DIAMOND_ADDRESS}\n`);

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

if (!PRIVATE_KEY) {
    console.error("Please set DEPLOYER_PRIVATE_KEY in .env");
    process.exit(1);
}

// ABIs
const InventoryDocsFacetABI = require('../src/contracts/abis/InventoryDocsFacet.json');

// Chain Config
const chainConfig = {
    id: NETWORK_NAME === 'sepolia' ? 11155111 : NETWORK_NAME === 'besu' ? 287287 : 1337,
    name: NETWORK_NAME,
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: [RPC_URL] },
    },
};

const account = privateKeyToAccount(PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`);

const client = createWalletClient({
    account,
    chain: chainConfig,
    transport: http(RPC_URL)
});

const publicClient = createPublicClient({
    chain: chainConfig,
    transport: http(RPC_URL)
});

async function main() {
    console.log("🚀 Starting Import Konversi...");
    console.log(`Deployer: ${account.address}`);

    // Read JSON file
    const jsonPath = path.join(__dirname, '../.konversi.json');
    if (!fs.existsSync(jsonPath)) {
        console.error("File .konversi.json not found!");
        process.exit(1);
    }

    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(rawData);

    // Target Dombak
    const dombakName = "Dombak 6-Pertamina Dex";
    if (!data[dombakName]) {
        console.error(`Key '${dombakName}' not found in JSON`);
        process.exit(1);
    }

    const entries = data[dombakName];
    console.log(`Found ${entries.length} entries for ${dombakName}`);

    // Constants based on checkInfo
    const DOMBAK_ID = 7n; // Dombak 1-Pertamax
    const TINGGI_UNIT_ID = 1n; // Centimeter (ID 1) based on inspection
    const VOLUME_UNIT_ID = 1n; // Liter (ID 1)

    // Batch processing to avoid nonce issues or overwhelming (though sequential await is fine for scripts)
    // We will process sequentially.

    let count = 0;
    const TOTAL = entries.length;

    console.log("Beginning import... (this may take a while)");

    for (const entry of entries) {
        count++;
        // Parse and Scale x100
        const tinggiVal = parseFloat(entry.tinggi); // e.g. 55.8
        const volumeVal = parseFloat(entry.volume); // e.g. 3578.6

        const tinggiScaled = BigInt(Math.round(tinggiVal * 100));
        const volumeScaled = BigInt(Math.round(volumeVal * 100));

        try {
            // Check if record already exists using getKonversiByTinggi
            const existingVolume = await publicClient.readContract({
                address: DIAMOND_ADDRESS,
                abi: InventoryDocsFacetABI,
                functionName: 'getKonversiByTinggi',
                args: [DOMBAK_ID, tinggiScaled]
            });

            // If existingVolume > 0 and matches our expected volume, skip
            if (existingVolume > 0n) {
                if (existingVolume === volumeScaled) {
                    console.log(`[${count}/${TOTAL}] ⏭️  Skip Tinggi: ${tinggiVal} (Already exists with same volume)`);
                } else {
                    console.log(`[${count}/${TOTAL}] ⚠️  Skip Tinggi: ${tinggiVal} (Exists with different volume: ${existingVolume} vs ${volumeScaled})`);
                }
                continue;
            }

            process.stdout.write(`[${count}/${TOTAL}] Importing Tinggi: ${tinggiVal} (${tinggiScaled}), Volume: ${volumeVal} (${volumeScaled})... `);

            // Create new konversi record
            const hash = await client.writeContract({
                address: DIAMOND_ADDRESS,
                abi: InventoryDocsFacetABI,
                functionName: 'createKonversi',
                args: [
                    DOMBAK_ID,
                    TINGGI_UNIT_ID,
                    VOLUME_UNIT_ID,
                    tinggiScaled,
                    volumeScaled
                ]
            });

            await publicClient.waitForTransactionReceipt({ hash });

            console.log(`✅ ${hash.substring(0, 10)}...`);

        } catch (error) {
            console.log(`❌ Error: ${error.message.split('\n')[0]}`);
            // Don't exit, try next?
        }
    }

    console.log("\n🎉 Import Finished!");
}

main().catch(console.error);
