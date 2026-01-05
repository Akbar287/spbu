/**
 * Generic Upgrade Facet Script
 * This script deploys any facet and updates the Diamond
 * 
 * Usage: node scripts/upgrade-facet.cjs --nama=FacetName
 * Example: node scripts/upgrade-facet.cjs --nama=PointOfSalesCoreFacet
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createPublicClient, createWalletClient, http, keccak256, toBytes } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const result = {};

    for (const arg of args) {
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            result[key] = value;
        }
    }

    return result;
}

const args = parseArgs();
const FACET_NAME = args.nama;

if (!FACET_NAME) {
    console.error('❌ Error: --nama parameter is required');
    console.error('Usage: node scripts/upgrade-facet.cjs --nama=FacetName');
    console.error('Example: node scripts/upgrade-facet.cjs --nama=PointOfSalesCoreFacet');
    process.exit(1);
}

// Convert FacetName to SCREAMING_SNAKE_CASE for deployment key
function toScreamingSnakeCase(str) {
    return str
        .replace(/Facet$/, '')
        .replace(/([A-Z])/g, '_$1')
        .toUpperCase()
        .replace(/^_/, '') + '_FACET';
}

// Configuration
const deploymentPath = path.join(__dirname, '../deployments/ganache.json');
if (!fs.existsSync(deploymentPath)) {
    throw new Error('Deployment file not found: ' + deploymentPath);
}
const deploymentData = require(deploymentPath);
const DIAMOND_ADDRESS = deploymentData.contracts.MAIN_DIAMOND;
const RPC_URL = 'http://127.0.0.1:7545';

// Get private key
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
if (!PRIVATE_KEY) {
    throw new Error('DEPLOYER_PRIVATE_KEY not found in .env');
}
const account = privateKeyToAccount(`0x${PRIVATE_KEY.replace('0x', '')}`);

// Create clients
const publicClient = createPublicClient({
    transport: http(RPC_URL),
});

const walletClient = createWalletClient({
    account,
    transport: http(RPC_URL),
});

// Diamond ABI for updateFacet
const DIAMOND_ABI = [
    {
        inputs: [
            { name: '_facetAddress', type: 'address' },
            { name: '_selectors', type: 'bytes4[]' },
        ],
        name: 'updateFacet',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
];

// Load artifact from contracts/domains
function loadArtifact(contractName) {
    const artifactPath = path.join(
        __dirname,
        '../artifacts/contracts/domains',
        `${contractName}.sol`,
        `${contractName}.json`
    );
    if (!fs.existsSync(artifactPath)) {
        throw new Error(`Artifact not found: ${artifactPath}\nMake sure the facet exists in contracts/domains/ and run 'npx hardhat compile' first.`);
    }
    return require(artifactPath);
}

// Extract function selectors from ABI
function getSelectors(abi) {
    const selectors = [];
    for (const item of abi) {
        if (item.type === 'function') {
            const signature = `${item.name}(${item.inputs.map(i => i.type).join(',')})`;
            const selector = keccak256(toBytes(signature)).slice(0, 10);
            selectors.push(selector);
            console.log(`   - ${item.name}: ${selector}`);
        }
    }
    return selectors;
}

// Deploy contract
async function deployContract(contractName, artifact) {
    console.log(`\n📦 Deploying ${contractName}...`);

    const hash = await walletClient.deployContract({
        abi: artifact.abi,
        bytecode: artifact.bytecode,
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`✅ ${contractName} deployed to: ${receipt.contractAddress}`);
    return receipt.contractAddress;
}

async function main() {
    console.log("\n========================================");
    console.log(`  UPGRADING ${FACET_NAME}`);
    console.log("========================================\n");
    console.log("Deployer:", account.address);
    console.log("Diamond Address:", DIAMOND_ADDRESS);

    // Load artifact
    console.log(`\n📂 Loading ${FACET_NAME} artifact...`);
    const artifact = loadArtifact(FACET_NAME);
    console.log(`✅ Artifact loaded successfully`);

    // Deploy Facet
    const facetAddress = await deployContract(FACET_NAME, artifact);

    // Get selectors
    console.log("\n📝 Extracting function selectors...");
    const selectors = getSelectors(artifact.abi);
    console.log(`Total selectors: ${selectors.length}`);

    // Update Diamond
    console.log(`\n🔄 Updating Diamond with new ${FACET_NAME}...`);
    const hash = await walletClient.writeContract({
        address: DIAMOND_ADDRESS,
        abi: DIAMOND_ABI,
        functionName: 'updateFacet',
        args: [facetAddress, selectors],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log("✅ Diamond updated successfully!");

    // Update deployment file
    console.log("\n📄 Updating deployment file...");
    const deploymentKey = toScreamingSnakeCase(FACET_NAME);
    deploymentData.contracts[deploymentKey] = facetAddress;
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
    console.log(`✅ deployments/ganache.json updated (${deploymentKey})`);

    // Update ABI files
    console.log("\n📄 Updating ABI files...");
    const abiDir = path.join(__dirname, '../src/contracts/abis');

    // Ensure ABI directory exists
    if (!fs.existsSync(abiDir)) {
        fs.mkdirSync(abiDir, { recursive: true });
    }

    // Save facet ABI
    const facetAbiPath = path.join(abiDir, `${FACET_NAME}.json`);
    fs.writeFileSync(facetAbiPath, JSON.stringify(artifact.abi, null, 2));
    console.log(`✅ ${FACET_NAME}.json updated`);

    // Update DiamondCombined.json
    const combinedPath = path.join(abiDir, 'DiamondCombined.json');
    let combinedAbi = [];
    if (fs.existsSync(combinedPath)) {
        combinedAbi = JSON.parse(fs.readFileSync(combinedPath, 'utf8'));
    }

    // Get function/event names from new facet
    const newNames = new Set();
    for (const item of artifact.abi) {
        if (item.type === 'function' || item.type === 'event') {
            newNames.add(item.name);
        }
    }

    // Filter out old functions/events with same names
    combinedAbi = combinedAbi.filter(item => {
        if (item.type === 'function' || item.type === 'event') {
            return !newNames.has(item.name);
        }
        return true;
    });

    // Add new facet ABI
    combinedAbi = [...combinedAbi, ...artifact.abi];
    fs.writeFileSync(combinedPath, JSON.stringify(combinedAbi, null, 2));
    console.log("✅ DiamondCombined.json updated");

    console.log("\n========================================");
    console.log("  UPGRADE COMPLETE!");
    console.log("========================================");
    console.log(`\n${FACET_NAME}: ${facetAddress}`);
    console.log(`Diamond: ${DIAMOND_ADDRESS}`);
    console.log("\nABI Files Updated:");
    console.log(`  - src/contracts/abis/${FACET_NAME}.json`);
    console.log(`  - src/contracts/abis/DiamondCombined.json`);
    console.log("\n");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("\n❌ Upgrade failed:");
        console.error(error.message || error);
        process.exit(1);
    });
