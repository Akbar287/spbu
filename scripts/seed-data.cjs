/**
 * Seed Script - Insert dummy data into blockchain
 * Run: node scripts/seed-data.cjs
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createPublicClient, createWalletClient, http } = require('viem');
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

// Load deployment file to get Diamond Address
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

// Load ABIs
const AccessControlABI = require('../src/contracts/abis/AccessControlFacet.json');
const IdentityMemberABI = require('../src/contracts/abis/IdentityMemberFacet.json');
const IdentityNotifABI = require('../src/contracts/abis/IdentityNotifFacet.json');
const OrganizationABI = require('../src/contracts/abis/OrganizationFacet.json');
const InventoryCoreABI = require('../src/contracts/abis/InventoryCoreFacet.json');
const InventoryDocsABI = require('../src/contracts/abis/InventoryDocsFacet.json');

// Combine ABIs
const COMBINED_ABI = [...AccessControlABI, ...IdentityMemberABI, ...IdentityNotifABI, ...OrganizationABI, ...InventoryCoreABI, ...InventoryDocsABI];

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

// Setup chain config
const chainConfig = {
    id: 11155111,
    name: NETWORK_NAME,
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
        chain: chainConfig,
        transport: http(RPC_URL),
    });

    const walletClient = createWalletClient({
        account,
        chain: chainConfig,
        transport: http(RPC_URL),
    });

    console.log(`📍 Deployer: ${account.address}`);

    // Get initial nonce for explicit nonce management
    let currentNonce = await publicClient.getTransactionCount({ address: account.address });
    console.log(`🔢 Starting nonce: ${currentNonce}\n`);

    // Helper function to write contract with nonce tracking
    async function writeContractWithNonce(params) {
        const hash = await walletClient.writeContract({
            ...params,
            nonce: currentNonce,
        });
        currentNonce++;
        return hash;
    }

    // ==================== 0. Setup Admin Role ====================
    console.log('🔐 Setting up Admin Role...');
    try {
        const hash = await writeContractWithNonce({
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
    const satuanUkurTinggiIds = {}; // namaSatuan -> id
    const satuanUkurVolumeIds = {}; // namaSatuan -> id
    const statusMemberIds = {}; // namaStatus -> id
    const ktpIds = {}; // nama -> id
    const spbuIds = {}; // namaSpbu -> id
    const divisiIds = {}; // namaDivisi -> id
    const levelIds = {}; // namaLevel -> id
    const jabatanIds = {}; // namaJabatan -> id

    // ==================== 1. Seed SatuanUkurTinggi ====================
    console.log('📝 Seeding SatuanUkurTinggi...');
    // Check existing data first
    let existingSatuanTinggi = [];
    try {
        const result = await publicClient.readContract({
            address: DIAMOND_ADDRESS,
            abi: COMBINED_ABI,
            functionName: 'getAllSatuanUkurTinggi',
            args: [0n, 100n],
        });
        // Handle both array and tuple returns
        existingSatuanTinggi = Array.isArray(result) ? result : (Array.isArray(result[0]) ? result[0] : []);
    } catch (e) { /* ignore if function not found */ }

    if (dummyData.SatuanUkurTinggi) {
        for (const satuan of dummyData.SatuanUkurTinggi) {
            // Check if already exists
            const existing = existingSatuanTinggi.find(s => s.namaSatuan === satuan.namaSatuan);
            if (existing) {
                satuanUkurTinggiIds[satuan.namaSatuan] = existing.satuanUkurTinggiId;
                console.log(`   ⏭️  ${satuan.namaSatuan} (Already exists, ID: ${existing.satuanUkurTinggiId})`);
                continue;
            }

            try {
                const hash = await writeContractWithNonce({
                    address: DIAMOND_ADDRESS,
                    abi: COMBINED_ABI,
                    functionName: 'createSatuanUkurTinggi',
                    args: [satuan.namaSatuan, satuan.singkatan],
                });

                const receipt = await publicClient.waitForTransactionReceipt({ hash });

                const logs = await publicClient.getContractEvents({
                    address: DIAMOND_ADDRESS,
                    abi: COMBINED_ABI,
                    eventName: 'SatuanUkurTinggiCreated',
                    fromBlock: receipt.blockNumber,
                    toBlock: receipt.blockNumber,
                });

                if (logs.length > 0) {
                    const id = logs[0].args.satuanUkurTinggiId;
                    satuanUkurTinggiIds[satuan.namaSatuan] = id;
                    console.log(`   ✅ ${satuan.namaSatuan} (ID: ${id})`);
                }
            } catch (error) {
                console.log(`   ❌ ${satuan.namaSatuan}: ${error.message.split('\n')[0]}`);
            }
        }
    }

    // ==================== 2. Seed SatuanUkurVolume ====================
    console.log('\n📝 Seeding SatuanUkurVolume...');
    if (dummyData.SatuanUkurVolume) {
        for (const satuan of dummyData.SatuanUkurVolume) {
            try {
                const hash = await writeContractWithNonce({
                    address: DIAMOND_ADDRESS,
                    abi: COMBINED_ABI,
                    functionName: 'createSatuanUkurVolume',
                    args: [satuan.namaSatuan, satuan.singkatan],
                });

                const receipt = await publicClient.waitForTransactionReceipt({ hash });

                const logs = await publicClient.getContractEvents({
                    address: DIAMOND_ADDRESS,
                    abi: COMBINED_ABI,
                    eventName: 'SatuanUkurVolumeCreated',
                    fromBlock: receipt.blockNumber,
                    toBlock: receipt.blockNumber,
                });

                if (logs.length > 0) {
                    const id = logs[0].args.satuanUkurVolumeId;
                    satuanUkurVolumeIds[satuan.namaSatuan] = id;
                    console.log(`   ✅ ${satuan.namaSatuan} (ID: ${id})`);
                }
            } catch (error) {
                console.log(`   ❌ ${satuan.namaSatuan}: ${error.message.split('\n')[0]}`);
            }
        }
    }

    // ==================== 3. Seed StatusMember ====================
    console.log('\n📝 Seeding StatusMember...');
    for (const status of dummyData.StatusMember) {
        try {
            const hash = await writeContractWithNonce({
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

            const hash = await writeContractWithNonce({
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
            const walletAddress = ktpData ? ktpData.walletAddress : '0xFE3B557E8Fb62b89F4916B721be55cEb828dBd73';

            const hash = await writeContractWithNonce({
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
            const hash = await writeContractWithNonce({
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

            const hash = await writeContractWithNonce({
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

            const hash = await writeContractWithNonce({
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

            const hash = await writeContractWithNonce({
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

    // ==================== 10. Grant Roles with Jabatan ====================
    console.log('\n📝 Granting Roles with Jabatan...');

    // Map jabatan names to their role hashes (keccak256)
    // These must match the constants in AccessControlFacet.sol
    const { keccak256, toBytes } = require('viem');

    const JABATAN_TO_ROLE = {
        'Komisaris': keccak256(toBytes('KOMISARIS_ROLE')),
        'Partner': keccak256(toBytes('PARTNER_ROLE')),
        'Direktur Utama': keccak256(toBytes('DIREKTUR_UTAMA_ROLE')),
        'Direktur': keccak256(toBytes('DIREKTUR_ROLE')),
        'Admin': keccak256(toBytes('ADMIN_ROLE')),
        'Operator': keccak256(toBytes('OPERATOR_ROLE')),
        'Security': keccak256(toBytes('SECURITY_ROLE')),
        'OfficeBoy': keccak256(toBytes('OFFICEBOY_ROLE')),
    };

    for (const mapping of dummyData.walletToJabatanIds) {
        try {
            const jabatanId = jabatanIds[mapping.namaJabatan] || 1n;
            const roleHash = JABATAN_TO_ROLE[mapping.namaJabatan];

            if (!roleHash) {
                console.log(`   ⚠️ ${mapping.namaJabatan}: No role mapping found, skipping`);
                continue;
            }

            const hash = await writeContractWithNonce({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'grantRoleWithJabatan',
                args: [roleHash, mapping.walletAddress, jabatanId],
            });

            await publicClient.waitForTransactionReceipt({ hash });
            console.log(`   ✅ ${mapping.namaJabatan} -> ${mapping.walletAddress.slice(0, 10)}... (Role granted)`);
        } catch (error) {
            console.log(`   ❌ ${mapping.namaJabatan}: ${error.message.split('\n')[0]}`);
        }
    }

    // ==================== Summary ====================
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED COMPLETE!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   SatuanUkurTinggi: ${Object.keys(satuanUkurTinggiIds).length}`);
    console.log(`   SatuanUkurVolume: ${Object.keys(satuanUkurVolumeIds).length}`);
    console.log(`   StatusMember: ${Object.keys(statusMemberIds).length}`);
    console.log(`   Ktp: ${Object.keys(ktpIds).length}`);
    console.log(`   Spbu: ${Object.keys(spbuIds).length}`);
    console.log(`   Divisi: ${Object.keys(divisiIds).length}`);
    console.log(`   Level: ${Object.keys(levelIds).length}`);
    console.log(`   Jabatan: ${Object.keys(jabatanIds).length}`);
    console.log(`   Wallet-Jabatan Mappings: ${dummyData.walletToJabatanIds.length}`);

    console.log('\n📝 ID Mappings:');
    console.log('   SatuanUkurTinggi:', satuanUkurTinggiIds);
    console.log('   SatuanUkurVolume:', satuanUkurVolumeIds);
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
