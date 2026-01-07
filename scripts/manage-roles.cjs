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
    'KOMISARIS_ROLE': keccak256(stringToBytes("KOMISARIS_ROLE")),
    'DIREKTUR_UTAMA_ROLE': keccak256(stringToBytes("DIREKTUR_UTAMA_ROLE")),
    'DIREKTUR_ROLE': keccak256(stringToBytes("DIREKTUR_ROLE")),
    'ADMIN_ROLE': keccak256(stringToBytes("ADMIN_ROLE")),
    'OPERATOR_ROLE': keccak256(stringToBytes("OPERATOR_ROLE")),
    'SECURITY_ROLE': keccak256(stringToBytes("SECURITY_ROLE")),
    'OFFICE_BOY_ROLE': keccak256(stringToBytes("OFFICE_BOY_ROLE")),
    'PARTNER_ROLE': keccak256(stringToBytes("PARTNER_ROLE"))
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
  --check         Check roles for a wallet
  --role=<ROLE>   Specify the role name (see Supported Roles below)
                  For --check, omit to check all roles
  --wallet=<ADDR> Specify the target wallet address

Supported Roles:
${Object.keys(ROLES).map(r => `  - ${r} (${ROLES[r]})`).join('\n')}

Examples:
  node scripts/manage-roles.cjs --grant --role=ADMIN_ROLE --wallet=0x123...
  node scripts/manage-roles.cjs --revoke --role=OPERATOR_ROLE --wallet=0x456...
  node scripts/manage-roles.cjs --check --wallet=0x789...
  node scripts/manage-roles.cjs --check --role=ADMIN_ROLE --wallet=0x789...
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
    const isCheck = args.includes('--check');

    const roleArg = args.find(a => a.startsWith('--role='));
    const walletArg = args.find(a => a.startsWith('--wallet='));

    if (!isGrant && !isRevoke && !isCheck) {
        console.error('❌ Error: Must specify --grant, --revoke, or --check');
        showHelp();
        process.exit(1);
    }

    if ((isGrant && isRevoke) || (isGrant && isCheck) || (isRevoke && isCheck)) {
        console.error('❌ Error: Cannot specify multiple actions (--grant, --revoke, --check)');
        process.exit(1);
    }

    if (!walletArg) {
        console.error('❌ Error: Must specify --wallet');
        showHelp();
        process.exit(1);
    }

    // For grant/revoke, role is required
    if ((isGrant || isRevoke) && !roleArg) {
        console.error('❌ Error: Must specify --role for --grant or --revoke');
        showHelp();
        process.exit(1);
    }

    const roleName = roleArg ? roleArg.split('=')[1] : null;
    const walletAddr = walletArg.split('=')[1];

    if (roleName && !ROLES[roleName]) {
        console.error(`❌ Error: Invalid role '${roleName}'. Use --help to see supported roles.`);
        process.exit(1);
    }

    const roleHash = roleName ? ROLES[roleName] : null;

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

    // ABI for AccessControl + Jabatan
    const accessControlABI = [
        {
            inputs: [
                { internalType: "bytes32", name: "role", type: "bytes32" },
                { internalType: "address", name: "account", type: "address" },
                { internalType: "uint256", name: "_jabatanId", type: "uint256" }
            ],
            name: "grantRoleWithJabatan",
            outputs: [],
            stateMutability: "nonpayable",
            type: "function"
        },
        {
            inputs: [
                { internalType: "bytes32", name: "role", type: "bytes32" },
                { internalType: "address", name: "account", type: "address" },
                { internalType: "uint256", name: "_jabatanId", type: "uint256" }
            ],
            name: "revokeRoleWithJabatan",
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
        },
        {
            inputs: [
                { internalType: "uint256", name: "_offset", type: "uint256" },
                { internalType: "uint256", name: "_limit", type: "uint256" }
            ],
            name: "getAllJabatan",
            outputs: [
                {
                    components: [
                        { internalType: "uint256", name: "jabatanId", type: "uint256" },
                        { internalType: "uint256", name: "levelId", type: "uint256" },
                        { internalType: "string", name: "namaJabatan", type: "string" },
                        { internalType: "string", name: "keterangan", type: "string" },
                        { internalType: "bytes32", name: "roleHash", type: "bytes32" },
                        { internalType: "uint256", name: "createdAt", type: "uint256" },
                        { internalType: "uint256", name: "updatedAt", type: "uint256" },
                        { internalType: "bool", name: "deleted", type: "bool" }
                    ],
                    internalType: "struct AppStorage.Jabatan[]",
                    name: "",
                    type: "tuple[]"
                },
                { internalType: "uint256", name: "", type: "uint256" }
            ],
            stateMutability: "view",
            type: "function"
        }
    ];

    // Handle --check command
    if (isCheck) {
        console.log(`\n🔍 Role Check`);
        console.log('='.repeat(50));
        console.log(`Wallet:  ${walletAddr}`);
        console.log(`Diamond: ${DIAMOND_ADDRESS}`);
        console.log('-'.repeat(50));

        try {
            if (roleName) {
                // Check specific role
                const hasRole = await publicClient.readContract({
                    address: DIAMOND_ADDRESS,
                    abi: accessControlABI,
                    functionName: 'hasRole',
                    args: [roleHash, walletAddr]
                });
                console.log(`${roleName}: ${hasRole ? '✅ YES' : '❌ NO'}`);
            } else {
                // Check all roles
                console.log('\nRole Status:');
                for (const [name, hash] of Object.entries(ROLES)) {
                    const hasRole = await publicClient.readContract({
                        address: DIAMOND_ADDRESS,
                        abi: accessControlABI,
                        functionName: 'hasRole',
                        args: [hash, walletAddr]
                    });
                    console.log(`  ${hasRole ? '✅' : '❌'} ${name}`);
                }
            }
            console.log('\n🎉 Check complete.');
        } catch (error) {
            console.error('\n❌ Check failed:');
            console.error(error.message || error);
        }
        return;
    }

    // Fetch all jabatan to find matching one
    console.log('\n🔍 Finding matching Jabatan...');
    let jabatanId = null;
    try {
        const [jabatanList] = await publicClient.readContract({
            address: DIAMOND_ADDRESS,
            abi: accessControlABI,
            functionName: 'getAllJabatan',
            args: [BigInt(0), BigInt(100)]
        });

        // Convert role name to jabatan name (e.g., ADMIN_ROLE -> Admin, DIREKTUR_ROLE -> Direktur)
        const jabatanName = roleName
            .replace('_ROLE', '')
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');

        for (const j of jabatanList) {
            if (!j.deleted && j.namaJabatan.toLowerCase() === jabatanName.toLowerCase()) {
                jabatanId = j.jabatanId;
                console.log(`✅ Found Jabatan: "${j.namaJabatan}" (ID: ${jabatanId})`);
                break;
            }
        }

        if (!jabatanId) {
            console.error(`❌ Error: No Jabatan found matching role "${roleName}" (looked for "${jabatanName}")`);
            console.log('\nAvailable Jabatan:');
            jabatanList.filter(j => !j.deleted).forEach(j => {
                console.log(`  - ID ${j.jabatanId}: ${j.namaJabatan}`);
            });
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error fetching Jabatan:', error.message);
        process.exit(1);
    }

    console.log(`\n🔮 Role Management (with Jabatan Sync)`);
    console.log('='.repeat(50));
    console.log(`Action:    ${isGrant ? 'GRANT' : 'REVOKE'}`);
    console.log(`Role:      ${roleName} (${roleHash})`);
    console.log(`Jabatan:   ID ${jabatanId}`);
    console.log(`Wallet:    ${walletAddr}`);
    console.log(`Diamond:   ${DIAMOND_ADDRESS}`);
    console.log(`Admin:     ${account.address}`);
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
            functionName: isGrant ? 'grantRoleWithJabatan' : 'revokeRoleWithJabatan',
            args: [roleHash, walletAddr, jabatanId]
        });

        console.log(`✅ Transaction submitted: ${hash}`);
        console.log('⏳ Waiting for confirmation...');

        await publicClient.waitForTransactionReceipt({ hash });
        console.log('🎉 Success! Role and Jabatan updated.');

    } catch (error) {
        console.error('\n❌ Transaction failed:');
        console.error(error.message || error);
    }
}

main().catch(console.error);

