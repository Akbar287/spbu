/**
 * Migrate legacy plaintext CMS data on-chain into AES-GCM encrypted strings.
 *
 * Scope:
 * - Kategori
 * - Tag
 * - Artikel
 *
 * Usage:
 *   node scripts/migrate-cms-encryption.mjs --network=sepolia --dry-run
 *   node scripts/migrate-cms-encryption.mjs --network=sepolia
 *
 * Optional flags:
 *   --network=sepolia|besu|ganache
 *   --batch=50
 *   --scope=kategori,tag,artikel
 *   --dry-run
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

const CMS_ABI = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../src/contracts/abis/CmsFacet.json'), 'utf8')
);

const AES_PREFIX = 'enc:aesgcm:v1:';
const LEGACY_XOR_PREFIX = 'enc:v1:';
const AES_GCM_NONCE_LENGTH = 12;

const args = process.argv.slice(2);
const argMap = Object.fromEntries(
    args.map((arg) => {
        if (!arg.startsWith('--')) return [arg, true];
        const cleaned = arg.slice(2);
        const eqIndex = cleaned.indexOf('=');
        if (eqIndex === -1) return [cleaned, true];
        return [cleaned.slice(0, eqIndex), cleaned.slice(eqIndex + 1)];
    }),
);

const networkName = String(argMap.network || 'sepolia');
const batchSize = Number(argMap.batch || 50);
const dryRun = Boolean(argMap['dry-run']);
const migrateLegacyXor = argMap['migrate-legacy-xor'] !== 'false';
const scope = new Set(
    String(argMap.scope || 'kategori,tag,artikel')
        .split(',')
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean),
);

const NETWORKS = {
    sepolia: defineChain({
        id: 11155111,
        name: 'Sepolia',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: { http: [process.env.REACT_APP_SEPOLIA_RPC_URL || process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org'] } },
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

function fail(message) {
    console.error(`❌ ${message}`);
    process.exit(1);
}

function getField(record, name, index) {
    if (!record) return undefined;
    if (typeof record === 'object' && name in record) return record[name];
    if (typeof record === 'object' && String(index) in record) return record[String(index)];
    if (Array.isArray(record)) return record[index];
    return undefined;
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

const chain = NETWORKS[networkName];
if (!chain) fail(`Network "${networkName}" tidak didukung.`);

const rpcUrl = chain.rpcUrls.default.http[0];
const diamondAddress = resolveDiamondAddress(networkName);
if (!diamondAddress) fail(`REACT_APP_DIAMOND_ADDRESS belum di-set, dan deployments/${networkName}.json tidak ditemukan / tidak berisi MAIN_DIAMOND.`);

const pk = process.env.DEPLOYER_PRIVATE_KEY;
if (!pk) fail('DEPLOYER_PRIVATE_KEY belum di-set di .env.');
const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);

const publicClient = createPublicClient({ chain, transport: http(rpcUrl) });
const walletClient = createWalletClient({ chain, transport: http(rpcUrl), account });

const stats = {
    migrated: 0,
    skipped: 0,
    failed: 0,
    domains: {
        kategori: { checked: 0, migrated: 0, skipped: 0, failed: 0 },
        tag: { checked: 0, migrated: 0, skipped: 0, failed: 0 },
        artikel: { checked: 0, migrated: 0, skipped: 0, failed: 0 },
    },
};

async function readContract(functionName, args = []) {
    return publicClient.readContract({
        address: diamondAddress,
        abi: CMS_ABI,
        functionName,
        args,
    });
}

async function writeContract(functionName, args = []) {
    const hash = await walletClient.writeContract({
        account,
        chain,
        address: diamondAddress,
        abi: CMS_ABI,
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

async function migrateKategori() {
    const total = Number(await readContract('getCountKategori'));
    console.log(`\n📁 Kategori: total counter ${total}`);

    for (let offset = 0; offset < total; offset += batchSize) {
        const list = await readContract('getAllKategori', [BigInt(offset), BigInt(batchSize)]);
        for (const item of list) {
            stats.domains.kategori.checked++;
            const id = getField(item, 'kategoriId', 0);
            const deleted = Boolean(getField(item, 'deleted', 5));
            if (deleted || !id || id === 0n) {
                stats.domains.kategori.skipped++;
                stats.skipped++;
                continue;
            }

            const kategori = getField(item, 'kategori', 1);
            const deskripsi = getField(item, 'deskripsi', 2);

            const nextKategori = convertToTargetCipher(kategori);
            const nextDeskripsi = convertToTargetCipher(deskripsi);
            const changed = nextKategori.changed || nextDeskripsi.changed;

            if (!changed) {
                stats.domains.kategori.skipped++;
                stats.skipped++;
                continue;
            }

            try {
                if (!dryRun) {
                    await writeContract('updateKategori', [id, nextKategori.value, nextDeskripsi.value]);
                }
                stats.domains.kategori.migrated++;
                stats.migrated++;
                console.log(`   ${dryRun ? '[DRY] ' : ''}✅ kategoriId=${id.toString()} migrated`);
            } catch (error) {
                stats.domains.kategori.failed++;
                stats.failed++;
                console.error(`   ❌ kategoriId=${id.toString()} failed: ${error?.shortMessage || error?.message || error}`);
            }
        }
    }
}

async function migrateTag() {
    const total = Number(await readContract('getCountTag'));
    console.log(`\n🏷️  Tag: total counter ${total}`);

    for (let offset = 0; offset < total; offset += batchSize) {
        const list = await readContract('getAllTag', [BigInt(offset), BigInt(batchSize)]);
        for (const item of list) {
            stats.domains.tag.checked++;
            const id = getField(item, 'tagId', 0);
            const deleted = Boolean(getField(item, 'deleted', 5));
            if (deleted || !id || id === 0n) {
                stats.domains.tag.skipped++;
                stats.skipped++;
                continue;
            }

            const nama = getField(item, 'nama', 1);
            const deskripsi = getField(item, 'deskripsi', 2);

            const nextNama = convertToTargetCipher(nama);
            const nextDeskripsi = convertToTargetCipher(deskripsi);
            const changed = nextNama.changed || nextDeskripsi.changed;

            if (!changed) {
                stats.domains.tag.skipped++;
                stats.skipped++;
                continue;
            }

            try {
                if (!dryRun) {
                    await writeContract('updateTag', [id, nextNama.value, nextDeskripsi.value]);
                }
                stats.domains.tag.migrated++;
                stats.migrated++;
                console.log(`   ${dryRun ? '[DRY] ' : ''}✅ tagId=${id.toString()} migrated`);
            } catch (error) {
                stats.domains.tag.failed++;
                stats.failed++;
                console.error(`   ❌ tagId=${id.toString()} failed: ${error?.shortMessage || error?.message || error}`);
            }
        }
    }
}

async function migrateArtikel() {
    const total = Number(await readContract('getCountArtikel'));
    console.log(`\n📰 Artikel: total counter ${total}`);

    for (let offset = 0; offset < total; offset += batchSize) {
        const list = await readContract('getAllArtikel', [BigInt(offset), BigInt(batchSize)]);
        for (const item of list) {
            stats.domains.artikel.checked++;
            const id = getField(item, 'artikelId', 0);
            const deleted = Boolean(getField(item, 'deleted', 7));
            if (deleted || !id || id === 0n) {
                stats.domains.artikel.skipped++;
                stats.skipped++;
                continue;
            }

            const title = getField(item, 'title', 1);
            const content = getField(item, 'content', 2);
            const active = Boolean(getField(item, 'active', 3));

            const nextTitle = convertToTargetCipher(title);
            const nextContent = convertToTargetCipher(content);
            const changed = nextTitle.changed || nextContent.changed;

            if (!changed) {
                stats.domains.artikel.skipped++;
                stats.skipped++;
                continue;
            }

            try {
                const kategoriIds = await readContract('getKategoriesByArtikel', [id]);
                const tagIds = await readContract('getTagsByArtikel', [id]);

                if (!dryRun) {
                    await writeContract('updateArtikel', [
                        id,
                        nextTitle.value,
                        kategoriIds,
                        tagIds,
                        nextContent.value,
                        active,
                    ]);
                }

                stats.domains.artikel.migrated++;
                stats.migrated++;
                console.log(`   ${dryRun ? '[DRY] ' : ''}✅ artikelId=${id.toString()} migrated`);
            } catch (error) {
                stats.domains.artikel.failed++;
                stats.failed++;
                console.error(`   ❌ artikelId=${id.toString()} failed: ${error?.shortMessage || error?.message || error}`);
            }
        }
    }
}

async function main() {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('🔐 CMS Plaintext -> AES-GCM Migration');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Network      : ${networkName} (${chain.id})`);
    console.log(`RPC          : ${rpcUrl}`);
    console.log(`Diamond      : ${diamondAddress}`);
    console.log(`Deployer     : ${account.address}`);
    console.log(`Dry run      : ${dryRun}`);
    console.log(`Batch size   : ${batchSize}`);
    console.log(`Scope        : ${Array.from(scope).join(', ')}`);
    console.log(`Migrate XOR  : ${migrateLegacyXor}`);

    const balance = await publicClient.getBalance({ address: account.address });
    console.log(`Balance      : ${(Number(balance) / 1e18).toFixed(6)} ETH`);
    if (!dryRun && balance === 0n) fail('Balance deployer 0 ETH, tidak bisa menulis transaksi.');

    if (scope.has('kategori')) await migrateKategori();
    if (scope.has('tag')) await migrateTag();
    if (scope.has('artikel')) await migrateArtikel();

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📊 Migration Summary');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(JSON.stringify(stats, null, 2));

    const outputDir = path.join(__dirname, '../deployments/migrations');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    const reportFile = path.join(outputDir, `cms-encryption-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify({
        timestamp: new Date().toISOString(),
        network: networkName,
        chainId: chain.id,
        dryRun,
        batchSize,
        scope: Array.from(scope),
        migrateLegacyXor,
        stats,
    }, null, 2));
    console.log(`\n📝 Report saved: ${reportFile}`);
}

main().catch((error) => {
    console.error('\n❌ Migration error:', error);
    process.exit(1);
});
