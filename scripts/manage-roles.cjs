'use client';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createPublicClient, createWalletClient, http, keccak256, toHex, stringToBytes } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// Configuration
const deploymentPath = path.join(__dirname, '../deployments/ganache.json');
const RPC_URL = process.env.RPC_URL || 'http://127.0.0.1:7545';
const DEPLOYER_PK = process.env.DEPLOYER_PRIVATE_KEY;

// Role Definitions (Must match AccessControlFacet.sol)
const ROLES = {
    'DEFAULT_ADMIN_ROLE': '0x0000000000000000000000000000000000000000000000000000000000000000',
    'KOMISARIS_ROLE': keccak256(stringToBytes("KOMISARIS_ROLE")),
    'DIREKTUR_ROLE': keccak256(stringToBytes("DIREKTUR_ROLE")),
    'ADMIN_ROLE': keccak256(stringToBytes("ADMIN_ROLE")),
    'OPERATOR_ROLE': keccak256(stringToBytes("OPERATOR_ROLE")),
};

function showHelp() {
    console.log(`
Manager Role Access Control
===========================
Usage: node scripts/manage-roles.cjs [OPTIONS]

Options:
  --help          Show this help message
  --grant         Grant a role to a wallet
  --revoke        Revoke a role from a wallet
  --role=<ROLE>   Specify the role name (see Supported Roles below)
  --wallet=<ADDR> Specify the target wallet address

Supported Roles:
${Object.keys(ROLES).map(r => `  - ${r} (${ROLES[r]})`).join('\n')}

Examples:
  node scripts/manage-roles.cjs --grant --role=ADMIN_ROLE --wallet=0x123...
  node scripts/manage-roles.cjs --revoke --role=OPERATOR_ROLE --wallet=0x456...
`);
}

async function main() {
    const args = process.argv.slice(2);

    // Help
    if (args.includes('--help')) {
        showHelp();
        return;
    }

    // Validation
    if (!fs.existsSync(deploymentPath)) {
        throw new Error('Deployment file not found: ' + deploymentPath);
    }
    const deploymentData = require(deploymentPath);
    const DIAMOND_ADDRESS = deploymentData.contracts.MAIN_DIAMOND;

    if (!DEPLOYER_PK) {
        console.error('❌ Error: DEPLOYER_PRIVATE_KEY not found in .env');
        process.exit(1);
    }

    // Parse Args
    const isGrant = args.includes('--grant');
    const isRevoke = args.includes('--revoke');

    const roleArg = args.find(a => a.startsWith('--role='));
    const walletArg = args.find(a => a.startsWith('--wallet='));

    if (!isGrant && !isRevoke) {
        console.error('❌ Error: Must specify --grant or --revoke');
        showHelp();
        process.exit(1);
    }

    if (isGrant && isRevoke) {
        console.error('❌ Error: Cannot specify both --grant and --revoke');
        process.exit(1);
    }

    if (!roleArg || !walletArg) {
        console.error('❌ Error: Must specify both --role and --wallet');
        showHelp();
        process.exit(1);
    }

    const roleName = roleArg.split('=')[1];
    const walletAddr = walletArg.split('=')[1];

    if (!ROLES[roleName]) {
        console.error(`❌ Error: Invalid role '${roleName}'. Use --help to see supported roles.`);
        process.exit(1);
    }

    const roleHash = ROLES[roleName];

    // Setup Client
    const account = privateKeyToAccount(DEPLOYER_PK);
    const client = createWalletClient({
        account,
        chain: {
            id: 1337,
            name: 'Ganache',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: { default: { http: [RPC_URL] } }
        },
        transport: http(RPC_URL)
    });

    const publicClient = createPublicClient({
        chain: {
            id: 1337,
            name: 'Ganache',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
            rpcUrls: { default: { http: [RPC_URL] } }
        },
        transport: http(RPC_URL)
    });

    // ABI for AccessControl
    const accessControlABI = [
        {
            inputs: [
                { internalType: "bytes32", name: "role", type: "bytes32" },
                { internalType: "address", name: "account", type: "address" }
            ],
            name: "grantRole",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function"
        },
        {
            inputs: [
                { internalType: "bytes32", name: "role", type: "bytes32" },
                { internalType: "address", name: "account", type: "address" }
            ],
            name: "revokeRole",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function"
        },
        {
            inputs: [
                { internalType: "bytes32", name: "role", type: "bytes32" },
                { internalType: "address", name: "account", type: "address" }
            ],
            name: "hasRole",
            outputs: [{ internalType: "bool", name: "", type: "bool" }],
            stateMutability: "view",
            type: "function"
        }
    ];

    console.log(`\n🔮 Role Management`);
    console.log('='.repeat(50));
    console.log(`Action: ${isGrant ? 'GRANT' : 'REVOKE'}`);
    console.log(`Role:   ${roleName} (${roleHash})`);
    console.log(`Wallet: ${walletAddr}`);
    console.log(`Diamond: ${DIAMOND_ADDRESS}`);
    console.log(`Admin:  ${account.address}`);
    console.log('-'.repeat(50));

    try {
        // Check current status
        const hasRole = await publicClient.readContract({
            address: DIAMOND_ADDRESS,
            abi: accessControlABI,
            functionName: 'hasRole',
            args: [roleHash, walletAddr]
        });

        if (isGrant && hasRole) {
            console.log('ℹ️  Wallet already has this role. Skipping.');
            return;
        }

        if (isRevoke && !hasRole) {
            console.log('ℹ️  Wallet does not have this role. Skipping.');
            return;
        }

        console.log('⏳ Submitting transaction...');
        const hash = await client.writeContract({
            address: DIAMOND_ADDRESS,
            abi: accessControlABI,
            functionName: isGrant ? 'grantRole' : 'revokeRole',
            args: [roleHash, walletAddr]
        });

        console.log(`✅ Transaction submitted: ${hash}`);
        console.log('⏳ Waiting for confirmation...');

        await publicClient.waitForTransactionReceipt({ hash });
        console.log('🎉 Success! Role updated.');

    } catch (error) {
        console.error('\n❌ Transaction failed:');
        console.error(error.message || error);
    }
}

main().catch(console.error);
