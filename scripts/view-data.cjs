/**
 * View Blockchain Data - Display data from contracts in table format
 * 
 * Usage:
 *   node scripts/view-data.cjs --MainDiamond     # All tables
 *   node scripts/view-data.cjs --Identity        # Identity domain only
 *   node scripts/view-data.cjs --Organization    # Organization domain only
 *   node scripts/view-data.cjs --Inventory       # Inventory domain only
 *   node scripts/view-data.cjs --Asset           # Asset domain only
 *   node scripts/view-data.cjs --Attendance      # Attendance domain only
 *   node scripts/view-data.cjs --help            # Show help
 */

require('dotenv').config();
const { createPublicClient, http } = require('viem');

// Configuration
const DIAMOND_ADDRESS = '0x305afe61b4ad6af5ec1b67b28293e25a726088bf';
const ADMIN_ADDRESS = '0xbc6cEd7495E205014E5bA41302DdE8B02d7371f1';
const RPC_URL = 'http://127.0.0.1:7545';

// Load ABIs
const AccessControlABI = require('../src/contracts/abis/AccessControlFacet.json');
const IdentityMemberABI = require('../src/contracts/abis/IdentityMemberFacet.json');
const IdentityNotifABI = require('../src/contracts/abis/IdentityNotifFacet.json');
const OrganizationABI = require('../src/contracts/abis/OrganizationFacet.json');
const InventoryCoreFacetABI = require('../src/contracts/abis/InventoryCoreFacet.json');
const AssetCoreFacetABI = require('../src/contracts/abis/AssetCoreFacet.json');
const AttendanceConfigFacetABI = require('../src/contracts/abis/AttendanceConfigFacet.json');

const COMBINED_ABI = [
    ...AccessControlABI,
    ...IdentityMemberABI,
    ...IdentityNotifABI,
    ...OrganizationABI,
    ...InventoryCoreFacetABI,
    ...AssetCoreFacetABI,
    ...AttendanceConfigFacetABI,
];

// Parse CLI arguments
const args = process.argv.slice(2);
const getDomain = () => {
    if (args.includes('--help') || args.includes('-h')) return 'help';
    if (args.includes('--Identity') || args.includes('-i')) return 'Identity';
    if (args.includes('--Organization') || args.includes('-o')) return 'Organization';
    if (args.includes('--Inventory') || args.includes('-inv')) return 'Inventory';
    if (args.includes('--Asset') || args.includes('-a')) return 'Asset';
    if (args.includes('--Attendance') || args.includes('-att')) return 'Attendance';
    if (args.includes('--MainDiamond') || args.includes('-m') || args.length === 0) return 'MainDiamond';
    return 'MainDiamond';
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

// Helper functions
const formatDate = (timestamp) => {
    if (!timestamp || timestamp === 0n) return '-';
    return new Date(Number(timestamp) * 1000).toLocaleDateString('id-ID');
};

const truncate = (str, len = 20) => {
    if (!str) return '-';
    return str.length > len ? str.slice(0, len) + '...' : str;
};

const formatAddr = (addr) => {
    if (!addr) return '-';
    return addr.slice(0, 6) + '...' + addr.slice(-4);
};

function showHelp() {
    console.log(`
📊 BLOCKCHAIN DATA VIEWER

Usage: node scripts/view-data.cjs [OPTIONS]

Options:
  --MainDiamond, -m      Show all tables (default)
  --Identity, -i         Show Identity domain tables (StatusMember, Ktp, AreaMember)
  --Organization, -o     Show Organization domain tables (Spbu, Divisi, Level, Jabatan)
  --Inventory, -inv      Show Inventory domain tables (Produk, Dombak)
  --Asset, -a            Show Asset domain tables (Fasilitas, Aset)
  --Attendance, -att     Show Attendance domain tables (StatusPresensi, Hari, JamKerja)
  --help, -h             Show this help message

Examples:
  node scripts/view-data.cjs                    # Show all tables
  node scripts/view-data.cjs --Identity         # Show only Identity tables
  node scripts/view-data.cjs --Organization     # Show only Organization tables
`);
}

async function main() {
    const domain = getDomain();

    if (domain === 'help') {
        showHelp();
        return;
    }

    console.log('\n📊 BLOCKCHAIN DATA VIEWER');
    console.log('='.repeat(80));
    console.log(`Diamond: ${DIAMOND_ADDRESS}`);
    console.log(`Domain: ${domain}`);
    console.log(`RPC: ${RPC_URL}\n`);

    const publicClient = createPublicClient({
        chain: localGanache,
        transport: http(RPC_URL),
    });

    // ==================== IDENTITY DOMAIN ====================
    if (domain === 'MainDiamond' || domain === 'Identity') {
        console.log('\n� DOMAIN: IDENTITY');
        console.log('='.repeat(80));

        // StatusMember
        console.log('\n�📋 TABLE: StatusMember');
        console.log('-'.repeat(80));
        try {
            const [result] = await publicClient.readContract({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'getAllStatusMember',
                args: [0n, 100n],
            });

            const data = result.filter(r => !r.deleted).map(r => ({
                ID: Number(r.statusMemberId),
                'Nama Status': r.namaStatus,
                'Keterangan': truncate(r.keterangan, 40),
                'Created': formatDate(r.createdAt),
            }));

            console.table(data);
            console.log(`Total: ${data.length} records\n`);
        } catch (e) {
            console.log(`Error: ${e.message.split('\n')[0]}\n`);
        }

        // Ktp
        console.log('\n📋 TABLE: Ktp (Members)');
        console.log('-'.repeat(80));
        try {
            const { encodeFunctionData, decodeFunctionResult } = require('viem');

            // Encode the function call
            const callData = encodeFunctionData({
                abi: COMBINED_ABI,
                functionName: 'getAllKtp',
                args: [0n, 100n],
            });

            // Make raw eth_call with from parameter
            const rawResult = await publicClient.call({
                to: DIAMOND_ADDRESS,
                data: callData,
                account: ADMIN_ADDRESS,
            });

            // Decode the result
            const decoded = decodeFunctionResult({
                abi: COMBINED_ABI,
                functionName: 'getAllKtp',
                data: rawResult.data,
            });

            const result = decoded[0];

            const data = result.filter(r => !r.deleted).map(r => ({
                ID: Number(r.ktpId),
                NIK: r.nik,
                Nama: r.nama,
                Gender: r.gender === 0 ? 'L' : 'P',
                'Tempat Lahir': r.tempatLahir,
                'Tgl Lahir': formatDate(r.tanggalLahir),
                Email: truncate(r.email, 25),
                Wallet: formatAddr(r.walletAddress),
                Verified: r.verified ? '✅' : '❌',
            }));

            console.table(data);
            console.log(`Total: ${data.length} records\n`);
        } catch (e) {
            console.log(`Error: ${e.message.split('\n')[0]}\n`);
        }
    }

    // ==================== ORGANIZATION DOMAIN ====================
    if (domain === 'MainDiamond' || domain === 'Organization') {
        console.log('\n� DOMAIN: ORGANIZATION');
        console.log('='.repeat(80));

        // Spbu
        console.log('\n�📋 TABLE: Spbu');
        console.log('-'.repeat(80));
        try {
            const [result] = await publicClient.readContract({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'getAllSpbu',
                args: [0n, 100n],
            });

            const data = result.filter(r => !r.deleted).map(r => ({
                ID: Number(r.spbuId),
                'Nama SPBU': r.namaSpbu,
                'Nomor SPBU': r.nomorSpbu,
                'Tgl Pendirian': formatDate(r.tanggalPendirian),
                Alamat: truncate(r.alamat, 30),
                'Luas': `${Number(r.luasLahan)} ${r.satuanLuas}`,
            }));

            console.table(data);
            console.log(`Total: ${data.length} records\n`);
        } catch (e) {
            console.log(`Error: ${e.message.split('\n')[0]}\n`);
        }

        // Divisi
        console.log('\n📋 TABLE: Divisi');
        console.log('-'.repeat(80));
        try {
            const [result] = await publicClient.readContract({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'getAllDivisi',
                args: [0n, 100n],
            });

            const data = result.filter(r => !r.deleted).map(r => ({
                ID: Number(r.divisiId),
                'SPBU ID': Number(r.spbuId),
                'Nama Divisi': r.namaDivisi,
                Keterangan: truncate(r.keterangan, 30) || '-',
                'Created': formatDate(r.createdAt),
            }));

            console.table(data);
            console.log(`Total: ${data.length} records\n`);
        } catch (e) {
            console.log(`Error: ${e.message.split('\n')[0]}\n`);
        }

        // Level
        console.log('\n📋 TABLE: Level');
        console.log('-'.repeat(80));
        try {
            const [result] = await publicClient.readContract({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'getAllLevel',
                args: [0n, 100n],
            });

            const data = result.filter(r => !r.deleted).map(r => ({
                ID: Number(r.levelId),
                'Divisi ID': Number(r.divisiId),
                'Nama Level': r.namaLevel,
                Keterangan: truncate(r.keterangan, 30) || '-',
                'Created': formatDate(r.createdAt),
            }));

            console.table(data);
            console.log(`Total: ${data.length} records\n`);
        } catch (e) {
            console.log(`Error: ${e.message.split('\n')[0]}\n`);
        }

        // Jabatan
        console.log('\n📋 TABLE: Jabatan');
        console.log('-'.repeat(80));
        try {
            const [result] = await publicClient.readContract({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'getAllJabatan',
                args: [0n, 100n],
            });

            const data = result.filter(r => !r.deleted).map(r => ({
                ID: Number(r.jabatanId),
                'Level ID': Number(r.levelId),
                'Nama Jabatan': r.namaJabatan,
                Keterangan: truncate(r.keterangan, 30) || '-',
                'RoleHash': r.roleHash,
                'Created': formatDate(r.createdAt),
            }));

            console.table(data);
            console.log(`Total: ${data.length} records\n`);
        } catch (e) {
            console.log(`Error: ${e.message.split('\n')[0]}\n`);
        }
    }

    // ==================== INVENTORY DOMAIN ====================
    if (domain === 'MainDiamond' || domain === 'Inventory') {
        console.log('\n🔷 DOMAIN: INVENTORY');
        console.log('='.repeat(80));

        // Produk
        console.log('\n📋 TABLE: Produk');
        console.log('-'.repeat(80));
        try {
            const [result] = await publicClient.readContract({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'getAllProduk',
                args: [0n, 100n],
            });

            const data = result.filter(r => !r.deleted).map(r => ({
                ID: Number(r.produkId),
                Kode: r.kodeProduk,
                Nama: r.namaProduk,
                Satuan: r.satuan,
                'Created': formatDate(r.createdAt),
            }));

            console.table(data);
            console.log(`Total: ${data.length} records\n`);
        } catch (e) {
            console.log(`Error: ${e.message.split('\n')[0]}\n`);
        }

        // Dombak
        console.log('\n📋 TABLE: Dombak (Tangki)');
        console.log('-'.repeat(80));
        try {
            const [result] = await publicClient.readContract({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'getAllDombak',
                args: [0n, 100n],
            });

            const data = result.filter(r => !r.deleted).map(r => ({
                ID: Number(r.dombakId),
                'SPBU ID': Number(r.spbuId),
                Nama: r.namaDombak,
                Kapasitas: Number(r.kapasitas),
                'Created': formatDate(r.createdAt),
            }));

            console.table(data);
            console.log(`Total: ${data.length} records\n`);
        } catch (e) {
            console.log(`Error: ${e.message.split('\n')[0]}\n`);
        }
    }

    // ==================== ASSET DOMAIN ====================
    if (domain === 'MainDiamond' || domain === 'Asset') {
        console.log('\n🔷 DOMAIN: ASSET');
        console.log('='.repeat(80));

        // Fasilitas
        console.log('\n📋 TABLE: Fasilitas');
        console.log('-'.repeat(80));
        try {
            const [result] = await publicClient.readContract({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'getAllFasilitas',
                args: [0n, 100n],
            });

            const data = result.filter(r => !r.deleted).map(r => ({
                ID: Number(r.fasilitasId),
                'SPBU ID': Number(r.spbuId),
                Nama: r.namaFasilitas,
                Keterangan: truncate(r.keterangan, 30),
                'Created': formatDate(r.createdAt),
            }));

            console.table(data);
            console.log(`Total: ${data.length} records\n`);
        } catch (e) {
            console.log(`Error: ${e.message.split('\n')[0]}\n`);
        }

        // Aset
        console.log('\n📋 TABLE: Aset');
        console.log('-'.repeat(80));
        try {
            const [result] = await publicClient.readContract({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'getAllAset',
                args: [0n, 100n],
            });

            const data = result.filter(r => !r.deleted).map(r => ({
                ID: Number(r.asetId),
                'Fasilitas ID': Number(r.fasilitasId),
                Nama: r.namaAset,
                Merek: r.merek,
                'Tgl Perolehan': formatDate(r.tanggalPerolehan),
            }));

            console.table(data);
            console.log(`Total: ${data.length} records\n`);
        } catch (e) {
            console.log(`Error: ${e.message.split('\n')[0]}\n`);
        }
    }

    // ==================== ATTENDANCE DOMAIN ====================
    if (domain === 'MainDiamond' || domain === 'Attendance') {
        console.log('\n🔷 DOMAIN: ATTENDANCE');
        console.log('='.repeat(80));

        // StatusPresensi
        console.log('\n📋 TABLE: StatusPresensi');
        console.log('-'.repeat(80));
        try {
            const [result] = await publicClient.readContract({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'getAllStatusPresensi',
                args: [0n, 100n],
            });

            const data = result.filter(r => !r.deleted).map(r => ({
                ID: Number(r.statusPresensiId),
                Nama: r.namaStatusPresensi,
                Keterangan: truncate(r.keterangan, 30),
                'Created': formatDate(r.createdAt),
            }));

            console.table(data);
            console.log(`Total: ${data.length} records\n`);
        } catch (e) {
            console.log(`Error: ${e.message.split('\n')[0]}\n`);
        }

        // Hari
        console.log('\n📋 TABLE: Hari');
        console.log('-'.repeat(80));
        try {
            const [result] = await publicClient.readContract({
                address: DIAMOND_ADDRESS,
                abi: COMBINED_ABI,
                functionName: 'getAllHari',
                args: [0n, 100n],
            });

            const data = result.filter(r => !r.deleted).map(r => ({
                ID: Number(r.hariId),
                'Nama Hari': r.namaHari,
                'Hari Kerja': r.hariKerja ? '✅' : '❌',
                Deskripsi: truncate(r.deskripsi, 30),
            }));

            console.table(data);
            console.log(`Total: ${data.length} records\n`);
        } catch (e) {
            console.log(`Error: ${e.message.split('\n')[0]}\n`);
        }
    }

    // ==================== SUMMARY ====================
    console.log('\n' + '='.repeat(80));
    console.log('📊 VIEW COMPLETE');
    console.log('='.repeat(80));
    console.log(`\nTip: Use --help to see available domain filters\n`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Error:', error.message);
        process.exit(1);
    });
