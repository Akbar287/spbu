
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { createWalletClient, createPublicClient, http, parseEther } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// Configuration
const DIAMOND_ADDRESS = '0x305afe61b4ad6af5ec1b67b28293e25a726088bf';
const RPC_URL = 'http://127.0.0.1:7545';
// Default Ganache private key for account[0] if DEPLOYER_PRIVATE_KEY is not set
// (Usually we should rely on .env, but for local ganache defaults are common)
// I will try to read from env or fallback to a known test key if needed, or better, just error if not found.
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

if (!PRIVATE_KEY) {
    console.error("Please set DEPLOYER_PRIVATE_KEY in .env");
    process.exit(1);
}

// ABIs
const InventoryDocsFacetABI = require('../src/contracts/abis/InventoryDocsFacet.json');

// Chain Config
const localGanache = {
    id: 1337,
    name: 'Ganache Local',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: [RPC_URL] },
    },
};

const account = privateKeyToAccount(PRIVATE_KEY.startsWith('0x') ? PRIVATE_KEY : `0x${PRIVATE_KEY}`);

const client = createWalletClient({
    account,
    chain: localGanache,
    transport: http(RPC_URL)
});

const publicClient = createPublicClient({
    chain: localGanache,
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
