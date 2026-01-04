/**
 * Register Facet Selectors to Diamond
 * This script registers all function selectors from deployed facets to the MainDiamond
 * Run: node scripts/register-facets.cjs
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createPublicClient, createWalletClient, http, keccak256, toBytes } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// Configuration
const deploymentPath = path.join(__dirname, '../deployments/ganache.json');
if (!fs.existsSync(deploymentPath)) {
    throw new Error('Deployment file not found: ' + deploymentPath);
}
const deploymentData = require(deploymentPath);
const DIAMOND_ADDRESS = deploymentData.contracts.MAIN_DIAMOND;
const RPC_URL = 'http://127.0.0.1:7545';

// Facet addresses (from deploy.js output)
const FACET_ADDRESSES = {
    AccessControlFacet: deploymentData.contracts.ACCESSCONTROL_FACET,
    IdentityMemberFacet: deploymentData.contracts.IDENTITYMEMBER_FACET,
    IdentityNotifFacet: deploymentData.contracts.IDENTITYNOTIF_FACET,
    OrganizationFacet: deploymentData.contracts.ORGANIZATION_FACET,
    HumanCapitalFacet: deploymentData.contracts.HUMANCAPITAL_FACET,
    AssetCoreFacet: deploymentData.contracts.ASSETCORE_FACET,
    AssetFileFacet: deploymentData.contracts.ASSETFILE_FACET,
    InventoryCoreFacet: deploymentData.contracts.INVENTORYCORE_FACET,
    InventoryDocsFacet: deploymentData.contracts.INVENTORYDOCS_FACET,
    InventoryTransferFacet: deploymentData.contracts.INVENTORYTRANSFER_FACET,
    LogisticCoreFacet: deploymentData.contracts.LOGISTICCORE_FACET,
    LogisticFileFacet: deploymentData.contracts.LOGISTICFILE_FACET,
    AttendanceConfigFacet: deploymentData.contracts.ATTENDANCECONFIG_FACET,
    AttendanceRecordFacet: deploymentData.contracts.ATTENDANCERECORD_FACET,
    PengadaanCoreFacet: deploymentData.contracts.PENGADAANCORE_FACET,
    PengadaanPaymentFacet: deploymentData.contracts.PENGADAANPAYMENT_FACET,
    PointOfSalesCoreFacet: deploymentData.contracts.POINTOFSALESCORE_FACET,
    PointOfSalesSalesFacet: deploymentData.contracts.POINTOFSALESSALES_FACET,
    FinanceFacet: deploymentData.contracts.FINANCE_FACET,
    QualityControlFacet: deploymentData.contracts.QUALITYCONTROL_FACET,
};

// Diamond ABI for addFacet
const DIAMOND_ABI = [
    {
        inputs: [
            { name: '_facetAddress', type: 'address' },
            { name: '_selectors', type: 'bytes4[]' },
        ],
        name: 'addFacet',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: '', type: 'bytes4' }],
        name: 'selectorToFacet',
        outputs: [{ name: '', type: 'address' }],
        stateMutability: 'view',
        type: 'function',
    },
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

// Helper: Extract function selectors from ABI
function getSelectorsFromABI(abi) {
    const selectors = [];

    for (const item of abi) {
        if (item.type === 'function') {
            // Build function signature
            const inputs = item.inputs.map(i => i.type).join(',');
            const signature = `${item.name}(${inputs})`;

            // Calculate selector (first 4 bytes of keccak256)
            const hash = keccak256(toBytes(signature));
            const selector = hash.slice(0, 10); // '0x' + 8 hex chars = 4 bytes

            selectors.push(selector);
        }
    }

    return selectors;
}

async function main() {
    console.log('🔧 Registering Facet Selectors to Diamond...\n');

    // Get private key
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('DEPLOYER_PRIVATE_KEY not found in .env');
    }

    // Setup clients
    const account = privateKeyToAccount(privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`);

    const publicClient = createPublicClient({
        chain: localGanache,
        transport: http(RPC_URL),
    });

    const walletClient = createWalletClient({
        account,
        chain: localGanache,
        transport: http(RPC_URL),
    });

    console.log(`📍 Deployer: ${account.address}`);
    console.log(`📍 Diamond: ${DIAMOND_ADDRESS}\n`);

    let totalSelectors = 0;
    let successCount = 0;

    for (const [facetName, facetAddress] of Object.entries(FACET_ADDRESSES)) {
        try {
            // Load ABI
            const abiPath = path.join(__dirname, '..', 'src', 'contracts', 'abis', `${facetName}.json`);

            if (!fs.existsSync(abiPath)) {
                console.log(`   ⚠️  ABI not found: ${facetName}`);
                continue;
            }

            const abi = require(abiPath);
            const selectors = getSelectorsFromABI(abi);

            if (selectors.length === 0) {
                console.log(`   ⚠️  No selectors: ${facetName}`);
                continue;
            }

            // Check if first selector is already registered
            const existingFacet = await publicClient.readContract({
                address: DIAMOND_ADDRESS,
                abi: DIAMOND_ABI,
                functionName: 'selectorToFacet',
                args: [selectors[0]],
            });

            if (existingFacet !== '0x0000000000000000000000000000000000000000') {
                console.log(`   ⏭️  ${facetName}: Already registered (${selectors.length} selectors)`);
                totalSelectors += selectors.length;
                successCount++;
                continue;
            }

            // Register facet
            console.log(`   📝 ${facetName}: Registering ${selectors.length} selectors...`);

            const hash = await walletClient.writeContract({
                address: DIAMOND_ADDRESS,
                abi: DIAMOND_ABI,
                functionName: 'addFacet',
                args: [facetAddress, selectors],
            });

            await publicClient.waitForTransactionReceipt({ hash });

            console.log(`   ✅ ${facetName}: ${selectors.length} selectors registered`);
            totalSelectors += selectors.length;
            successCount++;

        } catch (error) {
            console.log(`   ❌ ${facetName}: ${error.message.split('\n')[0]}`);
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ REGISTRATION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Facets registered: ${successCount}/${Object.keys(FACET_ADDRESSES).length}`);
    console.log(`   Total selectors: ${totalSelectors}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
