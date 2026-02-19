/**
 * Register Facet Selectors to Diamond
 * This script registers all function selectors from deployed facets to the MainDiamond
 * Run: node scripts/register-facets.cjs [--network=sepolia]
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createPublicClient, createWalletClient, http, keccak256, toBytes } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// Parse command line arguments
const args = process.argv.slice(2);
const networkArg = args.find(arg => arg.startsWith('--network='));
const NETWORK_NAME = networkArg ? networkArg.split('=')[1] : 'sepolia';
if (NETWORK_NAME !== 'sepolia') {
    console.error(`Unsupported network: ${NETWORK_NAME}. Use --network=sepolia`);
    process.exit(1);
}

// RPC URLs by network
const RPC_URLS = {
    sepolia: process.env.REACT_APP_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
};

const RPC_URL = RPC_URLS[NETWORK_NAME] || RPC_URLS.sepolia;

// Configuration
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

// List of all facets to register
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

// Helper to convert facet name to deployment key
// Some facets use ASSETCORE_FACET, others use ASSET_CORE_FACET
function getDeploymentKeys(facetName) {
    const base = facetName.replace('Facet', '');
    // Try both formats: ASSETCORE_FACET and ASSET_CORE_FACET
    const noUnderscore = base.toUpperCase() + '_FACET';
    const withUnderscore = base.replace(/([a-z])([A-Z])/g, '$1_$2').toUpperCase() + '_FACET';
    return [noUnderscore, withUnderscore];
}

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

// Setup chain config
const chainConfig = {
    id: 11155111,
    name: NETWORK_NAME,
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
        chain: chainConfig,
        transport: http(RPC_URL),
    });

    const walletClient = createWalletClient({
        account,
        chain: chainConfig,
        transport: http(RPC_URL),
    });

    console.log(`📍 Deployer: ${account.address}\n`);

    // Get initial nonce
    let currentNonce = await publicClient.getTransactionCount({ address: account.address });
    console.log(`� Starting nonce: ${currentNonce}\n`);

    let totalSelectors = 0;
    let successCount = 0;

    for (const facetName of FACETS) {
        try {
            // Get facet address from deployment - try both key formats
            const keys = getDeploymentKeys(facetName);
            let facetAddress = null;
            let usedKey = null;
            for (const key of keys) {
                if (deploymentData.contracts[key]) {
                    facetAddress = deploymentData.contracts[key];
                    usedKey = key;
                    break;
                }
            }

            if (!facetAddress) {
                console.log(`   ⚠️  ${facetName}: No deployment address found (tried: ${keys.join(', ')})`);
                continue;
            }

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

            // Check if first selector is already registered to THIS facet
            const existingFacet = await publicClient.readContract({
                address: DIAMOND_ADDRESS,
                abi: DIAMOND_ABI,
                functionName: 'selectorToFacet',
                args: [selectors[0]],
            });

            // Compare with lowercase to ensure consistent comparison
            if (existingFacet.toLowerCase() === facetAddress.toLowerCase()) {
                console.log(`   ⏭️  ${facetName}: Already registered (${selectors.length} selectors)`);
                totalSelectors += selectors.length;
                successCount++;
                continue;
            } else if (existingFacet !== '0x0000000000000000000000000000000000000000') {
                console.log(`   🔄 ${facetName}: Re-registering (old: ${existingFacet.slice(0, 10)}...)`);
            }

            // Register facet
            console.log(`   📝 ${facetName}: Registering ${selectors.length} selectors...`);

            const hash = await walletClient.writeContract({
                address: DIAMOND_ADDRESS,
                abi: DIAMOND_ABI,
                functionName: 'addFacet',
                args: [facetAddress, selectors],
                nonce: currentNonce,
            });

            currentNonce++;

            await publicClient.waitForTransactionReceipt({
                hash,
                timeout: 60_000,
                pollingInterval: 2_000,
            });

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
    console.log(`   Facets registered: ${successCount}/${FACETS.length}`);
    console.log(`   Total selectors: ${totalSelectors}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
