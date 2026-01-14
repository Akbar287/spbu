/**
 * Sync ABIs from Hardhat artifacts to src/contracts/abis
 * Run: node scripts/sync-abis.cjs
 */

const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = path.join(__dirname, '../artifacts/contracts/domains');
const ABIS_DIR = path.join(__dirname, '../src/contracts/abis');

// List of all facets to sync
const FACETS = [
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

console.log('🔄 Syncing ABIs from artifacts to src/contracts/abis...\n');

let synced = 0;
let failed = 0;
const combinedAbi = [];

for (const facet of FACETS) {
    const artifactPath = path.join(ARTIFACTS_DIR, `${facet}.sol`, `${facet}.json`);
    const abiPath = path.join(ABIS_DIR, `${facet}.json`);

    try {
        // Read artifact
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        const abi = artifact.abi;

        // Write ABI to src/contracts/abis
        fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
        console.log(`   ✅ ${facet}`);

        // Add to combined ABI (avoiding duplicates)
        for (const item of abi) {
            const signature = JSON.stringify(item);
            if (!combinedAbi.find(existing => JSON.stringify(existing) === signature)) {
                combinedAbi.push(item);
            }
        }

        synced++;
    } catch (error) {
        console.log(`   ❌ ${facet}: ${error.message}`);
        failed++;
    }
}

// Write combined ABI (DiamondCombined.json)
const combinedPath = path.join(ABIS_DIR, 'DiamondCombined.json');
fs.writeFileSync(combinedPath, JSON.stringify(combinedAbi, null, 2));
console.log(`\n   ✅ DiamondCombined.json (${combinedAbi.length} functions/events)`);

console.log('\n' + '='.repeat(50));
console.log(`✅ Synced: ${synced} facets`);
if (failed > 0) {
    console.log(`❌ Failed: ${failed} facets`);
}
console.log('='.repeat(50));
