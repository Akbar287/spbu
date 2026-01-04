/**
 * Seed Script - Insert dummy data into blockchain
 * Run: node scripts/seed-data.cjs
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createPublicClient, createWalletClient, http } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { ganache } = require('viem/chains');

// Configuration
const DIAMOND_ADDRESS = '0x305afe61b4ad6af5ec1b67b28293e25a726088bf';
const RPC_URL = 'http://127.0.0.1:7545';

// Load ABIs
const AccessControlABI = require('../src/contracts/abis/AccessControlFacet.json');
const IdentityMemberABI = require('../src/contracts/abis/IdentityMemberFacet.json');
const IdentityNotifABI = require('../src/contracts/abis/IdentityNotifFacet.json');
const OrganizationABI = require('../src/contracts/abis/OrganizationFacet.json');

// Combine ABIs
const COMBINED_ABI = [...AccessControlABI, ...IdentityMemberABI, ...IdentityNotifABI, ...OrganizationABI];

// Load dummy data
const dummyData = require('../dummy-data.json')[0];

// Helper: Convert date string to Unix timestamp
const dateToTimestamp = (dateStr) => {
    return BigInt(Math.floor(new Date(dateStr).getTime() / 1000));
};

// Helper: Convert gender string to enum
const genderToEnum = (gender) => {
    return gender === 'Pria' ? 0 : 1;
};

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
    console.log('🌱 Starting Seed Script...\n');

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

    // ==================== 0. Setup Admin Role ====================
    console.log('🔐 Setting up Admin Role...');
    try {
        const hash = await walletClient.writeContract({
            address: DIAMOND_ADDRESS,
            abi: COMBINED_ABI,
            functionName: 'setupDefaultAdmin',
            args: [account.address],
        });
        await publicClient.waitForTransactionReceipt({ hash });
        console.log(`   ✅ Admin role granted to deployer\n`);
    } catch (error) {
        if (error.message.includes('already')) {
            console.log(`   ⏭️  Admin role already set\n`);
        } else {
            console.log(`   ⚠️  Admin setup: ${error.message.split('\n')[0]}\n`);
        }
    }

    // Track IDs for relationships
    const statusMemberIds = {}; // namaStatus -> id
    const ktpIds = {}; // nama -> id
    const spbuIds = {}; // namaSpbu -> id
    const divisiIds = {}; // namaDivisi -> id
    const levelIds = {}; // namaLevel -> id
    const jabatanIds = {}; // namaJabatan -> id

    // ==================== 1. Seed StatusMember ====================
    console.log('📝 Seeding StatusMember...');
    for (const status of dummyData.StatusMember) {
        try {
            const hash = await walletClient.writeContract({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'createStatusMember',
                args: [status.namaStatus, status.keterangan],
            });

            const receipt = await publicClient.waitForTransactionReceipt({ hash });

            // Get created ID from event logs
            const logs = await publicClient.getContractEvents({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                eventName: 'StatusMemberCreated',
                fromBlock: receipt.blockNumber,
                toBlock: receipt.blockNumber,
            });

            if (logs.length > 0) {
                const id = logs[0].args.statusMemberId;
                statusMemberIds[status.namaStatus] = id;
                console.log(`   ✅ ${status.namaStatus} (ID: ${id})`);
            }
        } catch (error) {
            console.log(`   ❌ ${status.namaStatus}: ${error.message}`);
        }
    }

    // ==================== 2. Seed Ktp ====================
    console.log('\n📝 Seeding Ktp...');
    for (const ktp of dummyData.Ktp) {
        try {
            const statusMemberId = statusMemberIds[ktp.statusMemberId] || 1n;

            const hash = await walletClient.writeContract({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'createKtp',
                args: [
                    ktp.walletAddress,           // _targetAddress
                    statusMemberId,               // _statusMemberId
                    ktp.nik,                      // _nik
                    ktp.nama,                     // _nama
                    genderToEnum(ktp.gender),     // _gender
                    ktp.tempatLahir,              // _tempatLahir
                    dateToTimestamp(ktp.tanggalLahir), // _tanggalLahir
                    ktp.email,                    // _email
                    ktp.noHp,                     // _noHp
                    ktp.noWa,                     // _noWa
                ],
            });

            const receipt = await publicClient.waitForTransactionReceipt({ hash });

            const logs = await publicClient.getContractEvents({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                eventName: 'KtpCreated',
                fromBlock: receipt.blockNumber,
                toBlock: receipt.blockNumber,
            });

            if (logs.length > 0) {
                const id = logs[0].args.ktpId;
                ktpIds[ktp.nama] = id;
                console.log(`   ✅ ${ktp.nama} (ID: ${id})`);
            }
        } catch (error) {
            console.log(`   ❌ ${ktp.nama}: ${error.message}`);
        }
    }

    // ==================== 3. Seed AreaMember ====================
    console.log('\n📝 Seeding AreaMember...');
    for (const area of dummyData.AreaMember) {
        try {
            // Find wallet address from Ktp data
            const ktpData = dummyData.Ktp.find(k => k.nama === area.ktpId);
            const walletAddress = ktpData ? ktpData.walletAddress : '0xbc6cEd7495E205014E5bA41302DdE8B02d7371f1';

            const hash = await walletClient.writeContract({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'createAreaMember',
                args: [
                    walletAddress,      // _targetAddress (wallet, not ktpId)
                    area.provinsi,
                    area.kabupaten,
                    area.kecamatan,
                    area.kelurahan,
                    area.alamat,
                    area.rw,
                    area.rt,
                    area.no,
                    area.kodePos,
                ],
            });

            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            console.log(`   ✅ AreaMember for ${area.ktpId}`);
        } catch (error) {
            console.log(`   ❌ AreaMember for ${area.ktpId}: ${error.message}`);
        }
    }

    // ==================== 4. Seed Spbu ====================
    console.log('\n📝 Seeding Spbu...');
    for (const spbu of dummyData.Spbu) {
        try {
            const hash = await walletClient.writeContract({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'createSpbu',
                args: [
                    spbu.namaSpbu,
                    spbu.nomorSpbu,
                    dateToTimestamp(spbu.tanggalPendirian),
                    spbu.alamat,
                    BigInt(spbu.luasLahan),
                    spbu.satuanLuas,
                ],
            });

            const receipt = await publicClient.waitForTransactionReceipt({ hash });

            const logs = await publicClient.getContractEvents({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                eventName: 'SpbuCreated',
                fromBlock: receipt.blockNumber,
                toBlock: receipt.blockNumber,
            });

            if (logs.length > 0) {
                const id = logs[0].args.spbuId;
                spbuIds[spbu.namaSpbu] = id;
                console.log(`   ✅ ${spbu.namaSpbu} (ID: ${id})`);
            }
        } catch (error) {
            console.log(`   ❌ ${spbu.namaSpbu}: ${error.message}`);
        }
    }

    // ==================== 5. Seed Divisi ====================
    console.log('\n📝 Seeding Divisi...');
    for (const divisi of dummyData.Divisi) {
        try {
            const spbuId = spbuIds[divisi.spbuId] || 1n;

            const hash = await walletClient.writeContract({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'createDivisi',
                args: [spbuId, divisi.namaDivisi, divisi.keterangan],
            });

            const receipt = await publicClient.waitForTransactionReceipt({ hash });

            const logs = await publicClient.getContractEvents({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                eventName: 'DivisiCreated',
                fromBlock: receipt.blockNumber,
                toBlock: receipt.blockNumber,
            });

            if (logs.length > 0) {
                const id = logs[0].args.divisiId;
                divisiIds[divisi.namaDivisi] = id;
                console.log(`   ✅ ${divisi.namaDivisi} (ID: ${id})`);
            }
        } catch (error) {
            console.log(`   ❌ ${divisi.namaDivisi}: ${error.message}`);
        }
    }

    // ==================== 6. Seed Level ====================
    console.log('\n📝 Seeding Level...');
    for (const level of dummyData.Level) {
        try {
            const divisiId = divisiIds[level.divisiId] || 1n;

            const hash = await walletClient.writeContract({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'createLevel',
                args: [divisiId, level.namaLevel, level.keterangan],
            });

            const receipt = await publicClient.waitForTransactionReceipt({ hash });

            const logs = await publicClient.getContractEvents({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                eventName: 'LevelCreated',
                fromBlock: receipt.blockNumber,
                toBlock: receipt.blockNumber,
            });

            if (logs.length > 0) {
                const id = logs[0].args.levelId;
                levelIds[level.namaLevel] = id;
                console.log(`   ✅ ${level.namaLevel} (ID: ${id})`);
            }
        } catch (error) {
            console.log(`   ❌ ${level.namaLevel}: ${error.message}`);
        }
    }

    // ==================== 7. Seed Jabatan ====================
    console.log('\n📝 Seeding Jabatan...');
    for (const jabatan of dummyData.Jabatan) {
        try {
            const levelId = levelIds[jabatan.levelId] || 1n;

            const hash = await walletClient.writeContract({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'createJabatan',
                args: [levelId, jabatan.namaJabatan, jabatan.keterangan],
            });

            const receipt = await publicClient.waitForTransactionReceipt({ hash });

            const logs = await publicClient.getContractEvents({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                eventName: 'JabatanCreated',
                fromBlock: receipt.blockNumber,
                toBlock: receipt.blockNumber,
            });

            if (logs.length > 0) {
                const id = logs[0].args.jabatanId;
                jabatanIds[jabatan.namaJabatan] = id;
                console.log(`   ✅ ${jabatan.namaJabatan} (ID: ${id})`);
            }
        } catch (error) {
            console.log(`   ❌ ${jabatan.namaJabatan}: ${error.message}`);
        }
    }

    // ==================== 8. Assign Wallet to Jabatan ====================
    console.log('\n📝 Assigning Wallet to Jabatan...');
    for (const mapping of dummyData.walletToJabatanIds) {
        try {
            const jabatanId = jabatanIds[mapping.namaJabatan] || 1n;

            const hash = await walletClient.writeContract({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'assignJabatanToWallet',
                args: [jabatanId, mapping.walletAddress],
            });

            await publicClient.waitForTransactionReceipt({ hash });
            console.log(`   ✅ ${mapping.namaJabatan} -> ${mapping.walletAddress.slice(0, 10)}...`);
        } catch (error) {
            console.log(`   ❌ ${mapping.namaJabatan}: ${error.message}`);
        }
    }

    // ==================== Summary ====================
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   StatusMember: ${Object.keys(statusMemberIds).length}`);
    console.log(`   Ktp: ${Object.keys(ktpIds).length}`);
    console.log(`   Spbu: ${Object.keys(spbuIds).length}`);
    console.log(`   Divisi: ${Object.keys(divisiIds).length}`);
    console.log(`   Level: ${Object.keys(levelIds).length}`);
    console.log(`   Jabatan: ${Object.keys(jabatanIds).length}`);
    console.log(`   Wallet-Jabatan Mappings: ${dummyData.walletToJabatanIds.length}`);

    console.log('\n📝 ID Mappings:');
    console.log('   StatusMember:', statusMemberIds);
    console.log('   Spbu:', spbuIds);
    console.log('   Divisi:', divisiIds);
    console.log('   Level:', levelIds);
    console.log('   Jabatan:', jabatanIds);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error);
        process.exit(1);
    });
