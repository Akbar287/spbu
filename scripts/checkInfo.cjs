
require('dotenv').config();
const { createPublicClient, http } = require('viem');

// Configuration
const DIAMOND_ADDRESS = '0x305afe61b4ad6af5ec1b67b28293e25a726088bf';
const RPC_URL = 'http://127.0.0.1:7545';

// Load ABIs
const InventoryDocsFacetABI = require('../src/contracts/abis/InventoryDocsFacet.json');
const InventoryCoreFacetABI = require('../src/contracts/abis/InventoryCoreFacet.json');
const OrganizationFacetABI = require('../src/contracts/abis/OrganizationFacet.json');

const COMBINED_ABI = [
    ...InventoryDocsFacetABI,
    ...InventoryCoreFacetABI,
    ...OrganizationFacetABI
];

// Setup chain
const localGanache = {
    id: 1337,
    name: 'Ganache Local',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
        default: { http: [RPC_URL] },
    },
};

async function main() {
    console.log(`Checking info on ${DIAMOND_ADDRESS}`);

    const publicClient = createPublicClient({
        chain: localGanache,
        transport: http(RPC_URL),
    });

    // Check SatuanUkurTinggi
    try {
        const result = await publicClient.readContract({
            address: DIAMOND_ADDRESS,
            abi: COMBINED_ABI,
            functionName: 'getAllSatuanUkurTinggi',
            args: [0n, 100n],
        });
        console.log("SatuanUkurTinggi List:");
        result.forEach(u => console.log(`ID: ${Number(u.satuanUkurTinggiId)}, Nama: ${u.namaSatuan}, Singkatan: ${u.singkatan}`));
    } catch (e) {
        console.log("Error getting SatuanUkurTinggi:", e.message.split('\n')[0]);
    }

    // Check SatuanUkurVolume
    try {
        const result = await publicClient.readContract({
            address: DIAMOND_ADDRESS,
            abi: COMBINED_ABI,
            functionName: 'getAllSatuanUkurVolume',
            args: [0n, 100n],
        });
        console.log("SatuanUkurVolume List:");
        result.forEach(u => console.log(`ID: ${Number(u.satuanUkurVolumeId)}, Nama: ${u.namaSatuan}, Singkatan: ${u.singkatan}`));
    } catch (e) {
        console.log("Error getting SatuanUkurVolume:", e.message.split('\n')[0]);
    }

    // Check Dombak
    try {
        const [spbus] = await publicClient.readContract({
            address: DIAMOND_ADDRESS,
            abi: COMBINED_ABI,
            functionName: 'getAllSpbu',
            args: [0n, 100n],
        });
        console.log(`Found ${spbus.length} SPBUs`);

        for (const spbu of spbus) {
            console.log(`Checking Dombaks for SPBU ${spbu.spbuId} (${spbu.namaSpbu})...`);
            const dombaks = await publicClient.readContract({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'getDombakBySpbu',
                args: [spbu.spbuId],
            });
            dombaks.forEach(d => console.log(`  Dombak ID: ${d.dombakId}, Nama: ${d.namaDombak}`));
        }
    } catch (e) {
        console.log("Error getting Dombaks:", e.message.split('\n')[0]);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
