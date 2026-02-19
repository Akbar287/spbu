/**
 * Fix KTP Wallet Address
 * Updates the walletAddress field for a specific KTP ID
 * Run: node scripts/fix-ktp-wallet.cjs
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { createPublicClient, createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

// Configuration
const NETWORK_NAME = 'sepolia';
const RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';

const deploymentPath = path.join(__dirname, `../deployments/${NETWORK_NAME}.json`);
const deploymentData = require(deploymentPath);
const DIAMOND_ADDRESS = deploymentData.contracts.MAIN_DIAMOND;

// The KTP data to fix
const KTP_ID = 1n; // The ID of the KTP to update
const OLD_WALLET = '0xbc6cEd7495E205014E5bA41302DdE8B02d7371f1';
const NEW_WALLET = '0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73';

// Load ABI
const IdentityMemberABI = require('../src/contracts/abis/IdentityMemberFacet.json');

// Chain config
const chainConfig = {
    id: 11155111,
    name: 'Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [RPC_URL] } },
};

async function main() {
    console.log('🔧 Fix KTP Wallet Address\n');
    console.log(`📡 Network: ${NETWORK_NAME}`);
    console.log(`🔗 RPC URL: ${RPC_URL}`);
    console.log(`💎 Diamond: ${DIAMOND_ADDRESS}\n`);

    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) throw new Error('DEPLOYER_PRIVATE_KEY not set');

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

    // Step 1: Get current KTP by ID
    console.log(`1️⃣ Reading KTP ID ${KTP_ID}...`);
    const currentKtp = await publicClient.readContract({
        address: DIAMOND_ADDRESS,
        abi: IdentityMemberABI,
        functionName: 'getKtpById',
        args: [KTP_ID],
    });

    console.log('   Current KTP data:');
    console.log(`   - ktpId: ${currentKtp.ktpId}`);
    console.log(`   - nama: ${currentKtp.nama}`);
    console.log(`   - nik: ${currentKtp.nik}`);
    console.log(`   - walletAddress: ${currentKtp.walletAddress}`);
    console.log(`   - statusMemberId: ${currentKtp.statusMemberId}`);

    if (currentKtp.walletAddress.toLowerCase() === NEW_WALLET.toLowerCase()) {
        console.log('\n✅ Wallet address is already correct!');
        return;
    }

    // Step 2: Delete the old KTP and recreate with new wallet
    // Note: This approach deletes the old KTP and creates a new one
    // because the contract doesn't support changing wallet address directly

    console.log('\n2️⃣ Creating new KTP with new wallet address...');
    console.log('   (The old KTP will remain with old wallet - you may want to delete it manually)\n');

    // Create new KTP with new wallet
    const hash = await walletClient.writeContract({
        address: DIAMOND_ADDRESS,
        abi: IdentityMemberABI,
        functionName: 'createKtp',
        args: [
            NEW_WALLET,                    // _targetAddress (new wallet)
            currentKtp.statusMemberId,     // _statusMemberId
            currentKtp.nik,                // _nik
            currentKtp.nama,               // _nama
            currentKtp.gender,             // _gender
            currentKtp.tempatLahir,        // _tempatLahir
            currentKtp.tanggalLahir,       // _tanggalLahir
            currentKtp.email,              // _email
            currentKtp.noHp,               // _noHp
            currentKtp.noWa,               // _noWa
        ],
    });

    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`   ✅ New KTP created! Tx: ${hash.slice(0, 20)}...`);

    // Step 3: Verify new wallet
    console.log('\n3️⃣ Verifying new KTP...');
    const verifyHash = await walletClient.writeContract({
        address: DIAMOND_ADDRESS,
        abi: IdentityMemberABI,
        functionName: 'verifyKtp',
        args: [NEW_WALLET, true],
    });
    await publicClient.waitForTransactionReceipt({ hash: verifyHash });
    console.log('   ✅ New KTP verified!');

    // Step 4: Delete old KTP (optional)
    console.log('\n4️⃣ Deleting old KTP...');
    try {
        const deleteHash = await walletClient.writeContract({
            address: DIAMOND_ADDRESS,
            abi: IdentityMemberABI,
            functionName: 'deleteKtp',
            args: [OLD_WALLET],
        });
        await publicClient.waitForTransactionReceipt({ hash: deleteHash });
        console.log('   ✅ Old KTP deleted!');
    } catch (e) {
        console.log(`   ⚠️ Could not delete old KTP: ${e.message.split('\n')[0]}`);
    }

    console.log('\n✅ DONE! New KTP with wallet', NEW_WALLET.slice(0, 10) + '...');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
