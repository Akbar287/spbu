
require('dotenv').config();
const { createPublicClient, http } = require('viem');
const fs = require('fs');
const path = require('path');

// Configuration
const RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';
const deploymentPath = path.join(__dirname, '../deployments/sepolia.json');
if (!fs.existsSync(deploymentPath)) {
    throw new Error(`Deployment file not found: ${deploymentPath}`);
}
const deploymentData = require(deploymentPath);
const DIAMOND_ADDRESS = deploymentData.contracts.MAIN_DIAMOND;

// Load ABIs
const InventoryDocsFacetABI = require('../src/contracts/abis/InventoryDocsFacet.json');

// Chain Config
const sepolia = {
    id: 11155111,
    name: 'Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: [RPC_URL] },
    },
};

async function main() {
    console.log("🚀 Verifying Import...");

    const publicClient = createPublicClient({
        chain: sepolia,
        transport: http(RPC_URL)
    });

    // 1. Get Total Konversi
    // We don't have a direct count function exposed in Facet? 
    // InventoryDocsFacet.getAllKonversi has offset/limit.
    // InventoryCoreFacet usually has counters but they might be internal or exposed via specific getters.
    // InventoryDocsFacet has `getAllKonversi`. 
    // AppStorage has `konversiIds`.
    // There is no `getKonversiCount` in InventoryDocsFacet based on my view earlier (lines 250-600).
    // But `getAllKonversi` returns an array.
    // We can try to fetch a large chunk or check `getAllKonversi(0, 1).total` if it returns total?
    // Looking at `InventoryDocsFacet.sol`:
    /*
    function getAllKonversi(
        uint256 offset,
        uint256 limit,
        uint256 dombakId,
        uint256 tinggi,
        uint256 volume
    ) external view returns (AppStorage.Konversi[] memory)
    */
    // It returns only the array. No total count in return.

    // However, `getKonversiByTinggi` is what we really care about.

    // Check specific known values from JSON
    const jsonPath = path.join(__dirname, '../.konversi.json');
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(rawData);
    const entries = data["Dombak 1-Pertamax"];

    // Check first, middle, last
    const checkIndices = [0, Math.floor(entries.length / 2), entries.length - 1];

    for (const idx of checkIndices) {
        const entry = entries[idx];
        const tinggiScaled = BigInt(Math.round(parseFloat(entry.tinggi) * 100));
        const expectedVolume = BigInt(Math.round(parseFloat(entry.volume) * 100));

        process.stdout.write(`Checking index ${idx}: Tinggi ${entry.tinggi}... `);

        try {
            const result = await publicClient.readContract({
                address: DIAMOND_ADDRESS,
                abi: InventoryDocsFacetABI,
                functionName: 'getKonversiByTinggi',
                args: [1n, tinggiScaled] // dombakId 1
            });

            if (result === expectedVolume) {
                console.log(`✅ OK (Got ${result})`);
            } else {
                console.log(`❌ FAIL (Expected ${expectedVolume}, Got ${result})`);
            }
        } catch (e) {
            console.log(`❌ ERROR: ${e.message.split('\n')[0]}`);
        }
    }
}

main().catch(console.error);
