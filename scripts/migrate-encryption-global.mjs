/**
 * Global plaintext -> AES-GCM migration for on-chain CRUD entities.
 *
 * Strategy:
 * - Auto-discover `update*` functions that have `string` inputs.
 * - Pair with `getAll*` function when available.
 * - Build update args from row data, with safe custom resolvers for relations.
 * - Re-write only when at least one string field is still plaintext.
 *
 * Usage:
 *   node scripts/migrate-encryption-global.mjs --network=sepolia --dry-run
 *   node scripts/migrate-encryption-global.mjs --network=sepolia
 *
 * Optional:
 *   --batch=50
 *   --scope=updateAset,updateProduk,updatedStatusPurchase
 *   --exclude=updateRencanaPembelian
 *   --migrate-legacy-xor=true|false
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createPublicClient, createWalletClient, defineChain, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { AES } from '@stablelib/aes';
import { GCM } from '@stablelib/gcm';
import { hash as sha256 } from '@stablelib/sha256';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIAMOND_ABI = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../src/contracts/abis/DiamondCombined.json'), 'utf8')
);

const AES_PREFIX = 'enc:aesgcm:v1:';
const LEGACY_XOR_PREFIX = 'enc:v1:';
const AES_GCM_NONCE_LENGTH = 12;

const args = process.argv.slice(2);
const argMap = Object.fromEntries(
    args.map((arg) => {
        if (!arg.startsWith('--')) return [arg, true];
        const cleaned = arg.slice(2);
        const eq = cleaned.indexOf('=');
        if (eq === -1) return [cleaned, true];
        return [cleaned.slice(0, eq), cleaned.slice(eq + 1)];
    }),
);

const networkName = String(argMap.network || 'sepolia');
const batchSize = Number(argMap.batch || 50);
const dryRun = Boolean(argMap['dry-run']);
const migrateLegacyXor = argMap['migrate-legacy-xor'] !== 'false';
const includeScope = new Set(
    String(argMap.scope || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
);
const excludeScope = new Set(
    String(argMap.exclude || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean),
);

const NETWORKS = {
    sepolia: defineChain({
        id: 11155111,
        name: 'Sepolia',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: {
            default: {
                http: [
                    process.env.REACT_APP_SEPOLIA_RPC_URL ||
                        process.env.SEPOLIA_RPC_URL ||
                        'https://rpc.sepolia.org',
                ],
            },
        },
    }),
    besu: defineChain({
        id: 287287,
        name: 'Besu IBFT Private',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: [process.env.BESU_RPC_URL || 'https://akbar-kece.duckdns.org/'] } },
    }),
    ganache: defineChain({
        id: 1337,
        name: 'Ganache',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: ['http://127.0.0.1:7545'] } },
    }),
};

function fail(message) {
    console.error(`❌ ${message}`);
    process.exit(1);
}

function resolveDiamondAddress(network) {
    const fromEnv = process.env.REACT_APP_DIAMOND_ADDRESS;
    if (fromEnv) return fromEnv;

    const deploymentPath = path.join(__dirname, `../deployments/${network}.json`);
    if (!fs.existsSync(deploymentPath)) return '';

    try {
        const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        return deployment?.contracts?.MAIN_DIAMOND || '';
    } catch {
        return '';
    }
}

function bytesToBase64(bytes) {
    return Buffer.from(bytes).toString('base64');
}

function base64ToBytes(base64) {
    return Uint8Array.from(Buffer.from(base64, 'base64'));
}

function xorWithKey(input, key) {
    if (!key.length) return input;
    const out = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) out[i] = input[i] ^ key[i % key.length];
    return out;
}

function concatBytes(a, b) {
    const out = new Uint8Array(a.length + b.length);
    out.set(a, 0);
    out.set(b, a.length);
    return out;
}

function getRandomBytes(length) {
    const out = new Uint8Array(length);
    if (globalThis.crypto?.getRandomValues) {
        globalThis.crypto.getRandomValues(out);
        return out;
    }
    return Uint8Array.from(Buffer.from(Array.from({ length }, () => Math.floor(Math.random() * 256))));
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const encryptionSecret = process.env.REACT_APP_BLOCKCHAIN_CRUD_ENCRYPTION_KEY;
if (!encryptionSecret) {
    fail('REACT_APP_BLOCKCHAIN_CRUD_ENCRYPTION_KEY belum di-set. Isi dulu di .env sebelum migrasi.');
}
const derivedAesKey = sha256(encoder.encode(encryptionSecret));

function encryptAesString(plain) {
    if (typeof plain !== 'string' || plain.length === 0) return plain;
    const nonce = getRandomBytes(AES_GCM_NONCE_LENGTH);
    const aes = new AES(derivedAesKey, true);
    const gcm = new GCM(aes);
    const sealed = gcm.seal(nonce, encoder.encode(plain));
    gcm.clean();
    aes.clean();
    return `${AES_PREFIX}${bytesToBase64(concatBytes(nonce, sealed))}`;
}

function decryptLegacyXorString(cipher) {
    const payload = cipher.slice(LEGACY_XOR_PREFIX.length);
    const cipherBytes = base64ToBytes(payload);
    const keyBytes = encoder.encode(encryptionSecret);
    const plainBytes = xorWithKey(cipherBytes, keyBytes);
    return decoder.decode(plainBytes);
}

function convertToTargetCipher(value) {
    if (typeof value !== 'string') return { value, changed: false, reason: 'non-string' };
    if (!value) return { value, changed: false, reason: 'empty' };

    if (value.startsWith(AES_PREFIX)) {
        return { value, changed: false, reason: 'already-aes' };
    }

    if (value.startsWith(LEGACY_XOR_PREFIX)) {
        if (!migrateLegacyXor) {
            return { value, changed: false, reason: 'legacy-xor-skipped' };
        }
        try {
            const plain = decryptLegacyXorString(value);
            return { value: encryptAesString(plain), changed: true, reason: 'legacy-xor->aes' };
        } catch {
            return { value, changed: false, reason: 'legacy-xor-decrypt-failed' };
        }
    }

    return { value: encryptAesString(value), changed: true, reason: 'plain->aes' };
}

function normalizeKey(value) {
    return String(value || '')
        .replace(/^_+/, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();
}

function isFunction(item) {
    return item?.type === 'function';
}

function isTruthy(value) {
    return value !== undefined && value !== null;
}

function extractRowsFromGetAllResult(raw, getAllFn) {
    if (!getAllFn?.outputs?.length) return Array.isArray(raw) ? raw : [];
    const firstOutput = getAllFn.outputs[0];
    const firstOutputName = firstOutput?.name;

    if (getAllFn.outputs.length === 1) {
        if (Array.isArray(raw)) return raw;
        if (firstOutputName && Array.isArray(raw?.[firstOutputName])) return raw[firstOutputName];
        return [];
    }

    if (Array.isArray(raw)) {
        if (Array.isArray(raw[0])) return raw[0];
    }
    if (firstOutputName && Array.isArray(raw?.[firstOutputName])) return raw[firstOutputName];
    return [];
}

function indexRowByNormalizedKeys(row, outputComponents = []) {
    const index = new Map();

    for (const component of outputComponents) {
        if (!component?.name) continue;
        const key = normalizeKey(component.name);
        if (!index.has(key)) {
            index.set(key, row?.[component.name]);
        }
    }

    if (row && typeof row === 'object') {
        for (const key of Object.keys(row)) {
            if (/^\d+$/.test(key)) continue;
            const n = normalizeKey(key);
            if (!index.has(n)) {
                index.set(n, row[key]);
            }
        }
    }

    return index;
}

function pickIdValue(row, outputComponents = []) {
    for (const component of outputComponents) {
        if (!component?.name) continue;
        const normalized = normalizeKey(component.name);
        if (normalized.endsWith('id')) {
            const value = row?.[component.name];
            if (isTruthy(value)) return value;
        }
    }

    if (row && typeof row === 'object') {
        for (const key of Object.keys(row)) {
            if (/^\d+$/.test(key)) continue;
            const normalized = normalizeKey(key);
            if (normalized.endsWith('id') && isTruthy(row[key])) return row[key];
        }
    }

    return undefined;
}

const chain = NETWORKS[networkName];
if (!chain) fail(`Network "${networkName}" tidak didukung.`);

const rpcUrl = chain.rpcUrls.default.http[0];
const diamondAddress = resolveDiamondAddress(networkName);
if (!diamondAddress) {
    fail(
        `REACT_APP_DIAMOND_ADDRESS belum di-set, dan deployments/${networkName}.json tidak ditemukan / tidak berisi MAIN_DIAMOND.`
    );
}

const pk = process.env.DEPLOYER_PRIVATE_KEY;
if (!pk) fail('DEPLOYER_PRIVATE_KEY belum di-set di .env.');
const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);

const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
const walletClient = createWalletClient({ chain, transport: http(rpcUrl), account });

const abiFunctions = DIAMOND_ABI.filter(isFunction);
const fnByName = new Map(abiFunctions.map((fn) => [fn.name, fn]));

async function readContract(functionName, args = []) {
    return publicClient.readContract({
        account: account.address,
        address: diamondAddress,
        abi: DIAMOND_ABI,
        functionName,
        args,
    });
}

async function writeContract(functionName, args = []) {
    const hash = await walletClient.writeContract({
        account,
        chain,
        address: diamondAddress,
        abi: DIAMOND_ABI,
        functionName,
        args,
    });

    await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 120_000,
        pollingInterval: 2_000,
    });

    return hash;
}

const stats = {
    migrated: 0,
    skipped: 0,
    failed: 0,
    entities: {},
};

function ensureEntityStats(name) {
    if (!stats.entities[name]) {
        stats.entities[name] = {
            checked: 0,
            migrated: 0,
            skipped: 0,
            failed: 0,
            unsupported: false,
            notes: [],
        };
    }
    return stats.entities[name];
}

const resolverMap = {
    updateArtikel: {
        _kategoriIds: async ({ rowId }) => readContract('getKategoriesByArtikel', [rowId]),
        _tagIds: async ({ rowId }) => readContract('getTagsByArtikel', [rowId]),
    },
    updateJamKerja: {
        _hariIds: async ({ rowId }) => {
            const hariList = await readContract('getHariByJamKerja', [rowId]);
            if (!Array.isArray(hariList)) return [];
            return hariList
                .filter((h) => !h?.deleted && h?.hariId && h?.hariId !== 0n)
                .map((h) => h.hariId);
        },
    },
    updatePayung: {
        _dombakIds: async ({ rowId }) => readContract('getDombakByPayungId', [rowId]),
    },
    updateKtp: {
        _targetAddress: async ({ rowIndex }) =>
            rowIndex.get(normalizeKey('walletAddress')) || rowIndex.get(normalizeKey('walletMember')),
    },
    updateAreaMember: {
        _targetAddress: async ({ row }) => row?.__migrateTargetAddress,
    },
    updateNotifikasi: {
        _targetAddress: async ({ row }) => row?.__migrateTargetAddress,
    },
    updateRencanaPembelian: {
        _deleteDetailIds: async () => [],
        _produkId: async () => [],
        _jumlah: async () => [],
        _satuanJumlah: async () => [],
    },
};

const getAllArgsMap = {
    getAllPembayaran: () => [0n],
};

const manualEntities = [
    {
        name: 'StatusPurchase',
        updateFnName: 'updatedStatusPurchase',
        getAllFnName: 'getAllStatusPurchase',
    },
    {
        name: 'Pembayaran',
        updateFnName: 'updatePembayaran',
        getAllFnName: 'viewAllPembayaran',
    },
    {
        name: 'FileLo',
        updateFnName: 'updateFileLo',
        getAllFnName: 'viewAllFileLo',
    },
    {
        name: 'Segel',
        updateFnName: 'updateSegel',
        getAllFnName: 'viewAllSegel',
    },
    {
        name: 'FileAset',
        updateFnName: 'updateFileAset',
        specialSource: 'filesByAset',
        outputSourceFnName: 'getFilesByAsetId',
    },
    {
        name: 'FileFasilitas',
        updateFnName: 'updateFileFasilitas',
        specialSource: 'filesByFasilitas',
        outputSourceFnName: 'getFilesByFasilitasId',
    },
    {
        name: 'AreaMember',
        updateFnName: 'updateAreaMember',
        specialSource: 'areaMembersByKtp',
        outputSourceFnName: 'getAreaMembersByKtp',
    },
    {
        name: 'Notifikasi',
        updateFnName: 'updateNotifikasi',
        specialSource: 'notifikasiByKtp',
        outputSourceFnName: 'getNotifikasiByKtp',
    },
    {
        name: 'TypeDokumenStok',
        updateFnName: 'updateTypeDokumenStok',
        specialSource: 'scanById',
        byIdFnName: 'getTypeDokumenStokById',
    },
    {
        name: 'DetailTera',
        updateFnName: 'updateDetailTera',
        specialSource: 'byTotalAndId',
        totalFnName: 'getTotalDetailTera',
        byIdFnName: 'getDetailTeraById',
    },
    {
        name: 'DetailGaji',
        updateFnName: 'updateDetailGaji',
        specialSource: 'byTotalAndId',
        totalFnName: 'getTotalDetailGaji',
        byIdFnName: 'getDetailGajiById',
    },
    {
        name: 'Bonus',
        updateFnName: 'updateBonus',
        specialSource: 'byTotalAndId',
        totalFnName: 'getTotalBonus',
        byIdFnName: 'getBonusById',
    },
];

function discoverEntityPlans() {
    const autoPlans = abiFunctions
        .filter(
            (fn) =>
                fn.name.startsWith('update') &&
                fn.inputs?.some((input) => input.type === 'string'),
        )
        .map((updateFn) => {
            const entityName = updateFn.name.slice('update'.length);
            const getAllFnName = `getAll${entityName}`;
            const getAllFn = fnByName.get(getAllFnName);
            if (!getAllFn) return null;
            return {
                name: entityName,
                updateFnName: updateFn.name,
                getAllFnName,
            };
        })
        .filter(Boolean);

    const plans = [...autoPlans, ...manualEntities];
    const dedup = new Map();
    for (const plan of plans) dedup.set(plan.updateFnName, plan);
    return Array.from(dedup.values());
}

function shouldRunEntity(updateFnName) {
    if (includeScope.size > 0 && !includeScope.has(updateFnName)) return false;
    if (excludeScope.has(updateFnName)) return false;
    return true;
}

const specialRowsCache = new Map();
const walletCache = {
    loaded: false,
    wallets: [],
};

function getOutputComponentsFromArrayFunction(fnName) {
    const fn = fnByName.get(fnName);
    if (!fn?.outputs?.length) return [];
    const first = fn.outputs[0];
    return first?.components || [];
}

async function fetchAllRowsByPagination(getAllFnName, limit = 200) {
    const allRows = [];
    let offset = 0;
    let page = 0;
    const maxPages = 50_000;

    while (page < maxPages) {
        const { rows } = await fetchRows(getAllFnName, limit, offset);
        if (!rows.length) break;
        allRows.push(...rows);
        if (rows.length < limit) break;
        offset += rows.length;
        page++;
    }

    return allRows;
}

function chunkRows(rows, offset, batch) {
    return rows.slice(offset, offset + batch);
}

async function fetchAllKtpWallets() {
    if (walletCache.loaded) return walletCache.wallets;

    const rows = await fetchAllRowsByPagination('getAllKtp', 100);
    const wallets = rows
        .map((row) => row?.walletAddress)
        .filter((addr) => typeof addr === 'string' && addr.startsWith('0x'));

    walletCache.wallets = wallets;
    walletCache.loaded = true;
    return wallets;
}

async function fetchRowsByWalletWithPagination(fnName, wallet, limit = 200) {
    const rows = [];
    let offset = 0;
    let page = 0;
    const maxPages = 20_000;

    while (page < maxPages) {
        const result = await readContract(fnName, [wallet, BigInt(offset), BigInt(limit)]);
        let pageRows = [];
        let total = 0;

        if (Array.isArray(result)) {
            pageRows = Array.isArray(result[0]) ? result[0] : [];
            total = Number(result[1] || 0n);
        } else if (result && typeof result === 'object') {
            pageRows = Array.isArray(result.result) ? result.result : [];
            total = Number(result.total || 0n);
        }

        rows.push(...pageRows);
        offset += pageRows.length;
        page++;
        if (!pageRows.length || offset >= total) break;
    }

    return rows;
}

async function safeReadById(byIdFnName, id) {
    try {
        const row = await readContract(byIdFnName, [id]);
        return { ok: true, row };
    } catch {
        return { ok: false, row: null };
    }
}

async function findMaxExistingIdByGetById(byIdFnName, cap = 200_000n) {
    const first = await safeReadById(byIdFnName, 1n);
    if (!first.ok) return 0n;

    let low = 1n;
    let high = 1n;

    while (high < cap) {
        const probe = await safeReadById(byIdFnName, high);
        if (!probe.ok) break;
        low = high;
        high *= 2n;
    }

    if (high > cap) high = cap;

    while (low + 1n < high) {
        const mid = (low + high) / 2n;
        const probe = await safeReadById(byIdFnName, mid);
        if (probe.ok) low = mid;
        else high = mid;
    }

    return low;
}

async function buildSpecialRows(plan) {
    if (specialRowsCache.has(plan.updateFnName)) {
        return specialRowsCache.get(plan.updateFnName);
    }

    let rows = [];
    let outputComponents = [];

    if (plan.specialSource === 'filesByAset') {
        outputComponents = getOutputComponentsFromArrayFunction('getFilesByAsetId');
        const asets = await fetchAllRowsByPagination('getAllAset', 100);
        for (const aset of asets) {
            if (!aset?.asetId || aset?.deleted) continue;
            const files = await readContract('getFilesByAsetId', [aset.asetId]);
            if (Array.isArray(files)) rows.push(...files);
        }
    } else if (plan.specialSource === 'filesByFasilitas') {
        outputComponents = getOutputComponentsFromArrayFunction('getFilesByFasilitasId');
        const fasilitasList = await fetchAllRowsByPagination('getAllFasilitas', 100);
        for (const item of fasilitasList) {
            if (!item?.fasilitasId || item?.deleted) continue;
            const files = await readContract('getFilesByFasilitasId', [item.fasilitasId]);
            if (Array.isArray(files)) rows.push(...files);
        }
    } else if (plan.specialSource === 'areaMembersByKtp') {
        outputComponents = getOutputComponentsFromArrayFunction('getAreaMembersByKtp');
        const wallets = await fetchAllKtpWallets();
        for (const wallet of wallets) {
            const list = await fetchRowsByWalletWithPagination('getAreaMembersByKtp', wallet, 100);
            for (const row of list) {
                rows.push({ ...row, __migrateTargetAddress: wallet });
            }
        }
    } else if (plan.specialSource === 'notifikasiByKtp') {
        outputComponents = getOutputComponentsFromArrayFunction('getNotifikasiByKtp');
        const wallets = await fetchAllKtpWallets();
        for (const wallet of wallets) {
            const list = await fetchRowsByWalletWithPagination('getNotifikasiByKtp', wallet, 100);
            for (const row of list) {
                rows.push({ ...row, __migrateTargetAddress: wallet });
            }
        }
    } else if (plan.specialSource === 'scanById') {
        outputComponents = fnByName.get(plan.byIdFnName)?.outputs?.[0]?.components || [];
        const maxId = await findMaxExistingIdByGetById(plan.byIdFnName);
        for (let id = 1n; id <= maxId; id++) {
            const result = await safeReadById(plan.byIdFnName, id);
            if (result.ok) rows.push(result.row);
        }
    } else if (plan.specialSource === 'byTotalAndId') {
        outputComponents = fnByName.get(plan.byIdFnName)?.outputs?.[0]?.components || [];
        const totalRaw = await readContract(plan.totalFnName, []);
        const total = Number(totalRaw || 0n);
        for (let id = 1; id <= total; id++) {
            const result = await safeReadById(plan.byIdFnName, BigInt(id));
            if (result.ok) rows.push(result.row);
        }
    } else {
        throw new Error(`Unknown special source: ${plan.specialSource}`);
    }

    const value = { rows, outputComponents };
    specialRowsCache.set(plan.updateFnName, value);
    return value;
}

function getDefaultGetAllArgs(getAllFn) {
    const inputLen = getAllFn?.inputs?.length || 0;
    if (inputLen <= 2) return [];

    const extras = [];
    for (let i = 2; i < inputLen; i++) {
        const input = getAllFn.inputs[i];
        if (!input?.type) {
            extras.push(0n);
            continue;
        }
        if (input.type.startsWith('uint') || input.type.startsWith('int')) {
            extras.push(0n);
        } else if (input.type === 'bool') {
            extras.push(false);
        } else if (input.type.endsWith('[]')) {
            extras.push([]);
        } else {
            extras.push('');
        }
    }
    return extras;
}

async function fetchRows(getAllFnName, batch, offset) {
    const getAllFn = fnByName.get(getAllFnName);
    if (!getAllFn) throw new Error(`Function ${getAllFnName} tidak ditemukan di ABI`);

    const argCount = getAllFn.inputs?.length || 0;
    const fixedArgsBuilder = getAllArgsMap[getAllFnName];
    const fixedArgs = fixedArgsBuilder ? fixedArgsBuilder() : getDefaultGetAllArgs(getAllFn);

    let argsForCall = [];
    if (argCount === 0) {
        argsForCall = [];
    } else if (argCount >= 2) {
        argsForCall = [BigInt(offset), BigInt(batch), ...fixedArgs];
    } else {
        // Rare shape. Fallback to fixed args only.
        argsForCall = [...fixedArgs];
    }

    const raw = await readContract(getAllFnName, argsForCall);
    const rows = extractRowsFromGetAllResult(raw, getAllFn);
    return {
        rows: Array.isArray(rows) ? rows : [],
        getAllFn,
    };
}

function isZeroId(value) {
    return value === 0n || value === 0 || value === '0';
}

async function migrateEntity(plan) {
    const updateFn = fnByName.get(plan.updateFnName);
    const getAllFn = fnByName.get(plan.getAllFnName);
    const entityStats = ensureEntityStats(plan.updateFnName);

    if (!updateFn) {
        entityStats.unsupported = true;
        entityStats.notes.push('missing update function in ABI');
        return;
    }

    if (!plan.specialSource && !getAllFn) {
        entityStats.unsupported = true;
        entityStats.notes.push('missing getAll/view function in ABI');
        return;
    }

    console.log(`\n🔎 Entity ${plan.name} (${plan.updateFnName})`);

    let outputComponents = getAllFn?.outputs?.[0]?.components || [];
    let specialRows = null;
    if (plan.specialSource) {
        try {
            const built = await buildSpecialRows(plan);
            outputComponents = built.outputComponents || [];
            specialRows = built.rows || [];
        } catch (error) {
            entityStats.unsupported = true;
            entityStats.notes.push(
                `build special source gagal: ${error?.shortMessage || error?.message || error}`
            );
            console.error(
                `   ⚠️ skip entity: ${error?.shortMessage || error?.message || error}`
            );
            return;
        }
    }

    let offset = 0;
    let page = 0;
    const maxPages = 20_000;

    while (page < maxPages) {
        let rows = [];
        if (plan.specialSource) {
            rows = chunkRows(specialRows, offset, batchSize);
        } else {
            try {
                const fetched = await fetchRows(plan.getAllFnName, batchSize, offset);
                rows = fetched.rows;
            } catch (error) {
                entityStats.unsupported = true;
                entityStats.notes.push(
                    `read ${plan.getAllFnName} gagal: ${error?.shortMessage || error?.message || error}`
                );
                console.error(
                    `   ⚠️ skip entity: ${error?.shortMessage || error?.message || error}`
                );
                return;
            }
        }

        if (!rows.length) break;

        for (const row of rows) {
            entityStats.checked++;
            try {
                const rowIndex = indexRowByNormalizedKeys(row, outputComponents);
                const rowId = pickIdValue(row, outputComponents);
                const deletedValue =
                    rowIndex.get(normalizeKey('deleted')) ??
                    (typeof row?.deleted !== 'undefined' ? row.deleted : undefined);

                if (deletedValue === true || isZeroId(rowId) || !isTruthy(rowId)) {
                    entityStats.skipped++;
                    stats.skipped++;
                    continue;
                }

                if (plan.updateFnName === 'updateRencanaPembelian' && rowIndex.get(normalizeKey('konfirmasi')) === true) {
                    // Contract rejects update when already confirmed.
                    entityStats.skipped++;
                    stats.skipped++;
                    continue;
                }

                const updateArgs = [];
                let changed = false;

                for (let argIndex = 0; argIndex < updateFn.inputs.length; argIndex++) {
                    const input = updateFn.inputs[argIndex];
                    const inputName = input.name || `arg${argIndex}`;
                    const inputNormalized = normalizeKey(inputName);
                    const resolver = resolverMap[plan.updateFnName]?.[inputName];

                    let value;
                    if (resolver) {
                        value = await resolver({
                            row,
                            rowIndex,
                            rowId,
                            input,
                            updateFn,
                            plan,
                        });
                    } else if (argIndex === 0) {
                        if (input.type === 'address') {
                            value =
                                rowIndex.get(normalizeKey('walletAddress')) ||
                                rowIndex.get(normalizeKey('walletMember')) ||
                                rowIndex.get(normalizeKey('targetAddress'));
                        } else {
                            value = rowId;
                        }
                    } else {
                        value = rowIndex.get(inputNormalized);
                    }

                    if (!isTruthy(value)) {
                        throw new Error(`missing arg ${inputName}`);
                    }

                    if (input.type === 'string') {
                        const converted = convertToTargetCipher(value);
                        value = converted.value;
                        if (converted.changed) changed = true;
                    }

                    updateArgs.push(value);
                }

                if (!changed) {
                    entityStats.skipped++;
                    stats.skipped++;
                    continue;
                }

                if (!dryRun) {
                    await writeContract(plan.updateFnName, updateArgs);
                }
                entityStats.migrated++;
                stats.migrated++;
                console.log(
                    `   ${dryRun ? '[DRY] ' : ''}✅ ${plan.updateFnName} rowId=${rowId?.toString?.() || String(rowId)}`
                );
            } catch (error) {
                entityStats.failed++;
                stats.failed++;
                console.error(
                    `   ❌ row failed: ${error?.shortMessage || error?.message || error}`
                );
            }
        }

        page++;
        if (plan.specialSource) {
            if (offset + rows.length >= specialRows.length) break;
        } else {
            if ((getAllFn.inputs?.length || 0) === 0) break;
        }
        if (rows.length < batchSize) break;
        offset += rows.length;
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔐 Global Plaintext -> AES-GCM Migration');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Network      : ${networkName} (${chain.id})`);
    console.log(`RPC          : ${rpcUrl}`);
    console.log(`Diamond      : ${diamondAddress}`);
    console.log(`Deployer     : ${account.address}`);
    console.log(`Dry run      : ${dryRun}`);
    console.log(`Batch size   : ${batchSize}`);
    console.log(`Scope        : ${includeScope.size ? Array.from(includeScope).join(', ') : 'auto-all'}`);
    console.log(`Exclude      : ${excludeScope.size ? Array.from(excludeScope).join(', ') : '-'}`);
    console.log(`Migrate XOR  : ${migrateLegacyXor}`);

    const balance = await publicClient.getBalance({ address: account.address });
    console.log(`Balance      : ${(Number(balance) / 1e18).toFixed(6)} ETH`);
    if (!dryRun && balance === 0n) fail('Balance deployer 0 ETH, tidak bisa menulis transaksi.');

    const plans = discoverEntityPlans()
        .filter((plan) => shouldRunEntity(plan.updateFnName))
        .sort((a, b) => a.updateFnName.localeCompare(b.updateFnName));

    if (!plans.length) {
        console.log('\n⚠️ Tidak ada entity yang lolos filter scope/exclude.');
        return;
    }

    console.log(`\n📦 Selected entities (${plans.length}):`);
    for (const plan of plans) {
        const sourceLabel = plan.getAllFnName || `special:${plan.specialSource || 'custom'}`;
        console.log(`- ${plan.updateFnName} <- ${sourceLabel}`);
    }

    for (const plan of plans) {
        await migrateEntity(plan);
    }

    const unsupported = Object.entries(stats.entities)
        .filter(([, value]) => value.unsupported)
        .map(([name]) => name);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 Migration Summary');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(JSON.stringify({ ...stats, unsupported }, null, 2));

    const outputDir = path.join(__dirname, '../deployments/migrations');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const reportFile = path.join(outputDir, `global-encryption-${Date.now()}.json`);
    fs.writeFileSync(
        reportFile,
        JSON.stringify(
            {
                timestamp: new Date().toISOString(),
                network: networkName,
                chainId: chain.id,
                dryRun,
                batchSize,
                includeScope: Array.from(includeScope),
                excludeScope: Array.from(excludeScope),
                migrateLegacyXor,
                stats,
            },
            null,
            2
        )
    );
    console.log(`\n📝 Report saved: ${reportFile}`);
}

main().catch((error) => {
    console.error('\n❌ Migration error:', error);
    process.exit(1);
});
