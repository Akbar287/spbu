import { AES } from '@stablelib/aes';
import { GCM } from '@stablelib/gcm';
import { hash as sha256 } from '@stablelib/sha256';
import { SECURE_CRUD_CONFIG, shouldApplySecurity } from './secureCrud.config';

const encoder = new TextEncoder();
const decoder = new TextDecoder();
export const LEGACY_XOR_PREFIX = 'enc:v1:';
const AES_GCM_NONCE_LENGTH = 12;

function bytesToBase64(bytes: Uint8Array): string {
    const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');

    if (typeof btoa === 'function') {
        return btoa(binary);
    }

    const maybeBuffer = (globalThis as any).Buffer;
    if (maybeBuffer) return maybeBuffer.from(binary, 'binary').toString('base64');

    throw new Error('No base64 encoder available in current runtime');
}

function base64ToBytes(base64: string): Uint8Array {
    let binary = '';
    if (typeof atob === 'function') {
        binary = atob(base64);
    } else {
        const maybeBuffer = (globalThis as any).Buffer;
        if (!maybeBuffer) throw new Error('No base64 decoder available in current runtime');
        binary = maybeBuffer.from(base64, 'base64').toString('binary');
    }

    return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function xorWithKey(input: Uint8Array, key: Uint8Array): Uint8Array {
    if (!key.length) return input;

    const out = new Uint8Array(input.length);
    for (let i = 0; i < input.length; i++) {
        out[i] = input[i] ^ key[i % key.length];
    }
    return out;
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
    const out = new Uint8Array(a.length + b.length);
    out.set(a, 0);
    out.set(b, a.length);
    return out;
}

function randomBytes(length: number): Uint8Array {
    const out = new Uint8Array(length);

    if (globalThis.crypto?.getRandomValues) {
        globalThis.crypto.getRandomValues(out);
        return out;
    }

    for (let i = 0; i < out.length; i++) {
        out[i] = Math.floor(Math.random() * 256);
    }
    return out;
}

let cachedKeySource = '';
let cachedDerivedKey: Uint8Array | null = null;

function getDerivedAesKey(secret: string): Uint8Array {
    if (cachedDerivedKey && cachedKeySource === secret) return cachedDerivedKey;

    cachedKeySource = secret;
    cachedDerivedKey = sha256(encoder.encode(secret));
    return cachedDerivedKey;
}

function encryptStringAesGcm(plain: string): string {
    const key = getDerivedAesKey(SECURE_CRUD_CONFIG.secretKey);
    const nonce = randomBytes(AES_GCM_NONCE_LENGTH);
    const plaintext = encoder.encode(plain);

    const aes = new AES(key, true);
    const gcm = new GCM(aes);
    const sealed = gcm.seal(nonce, plaintext);

    const payload = concatBytes(nonce, sealed);
    const encodedPayload = bytesToBase64(payload);

    gcm.clean();
    aes.clean();

    return `${SECURE_CRUD_CONFIG.cipherPrefix}${encodedPayload}`;
}

function decryptStringAesGcm(ciphertext: string): string {
    const payload = base64ToBytes(ciphertext.slice(SECURE_CRUD_CONFIG.cipherPrefix.length));
    if (payload.length <= AES_GCM_NONCE_LENGTH) return ciphertext;

    const nonce = payload.subarray(0, AES_GCM_NONCE_LENGTH);
    const sealed = payload.subarray(AES_GCM_NONCE_LENGTH);
    const key = getDerivedAesKey(SECURE_CRUD_CONFIG.secretKey);

    const aes = new AES(key);
    const gcm = new GCM(aes);
    const opened = gcm.open(nonce, sealed);

    gcm.clean();
    aes.clean();

    if (!opened) return ciphertext;
    return decoder.decode(opened);
}

function decryptLegacyXorV1(ciphertext: string): string {
    try {
        const payload = ciphertext.slice(LEGACY_XOR_PREFIX.length);
        const cipherBytes = base64ToBytes(payload);
        const key = encoder.encode(SECURE_CRUD_CONFIG.secretKey);
        const plainBytes = xorWithKey(cipherBytes, key);
        return decoder.decode(plainBytes);
    } catch {
        return ciphertext;
    }
}

export function isAesGcmCiphertext(value: string): boolean {
    return value.startsWith(SECURE_CRUD_CONFIG.cipherPrefix);
}

export function isLegacyXorCiphertext(value: string): boolean {
    return value.startsWith(LEGACY_XOR_PREFIX);
}

export function isEncryptedString(value: string): boolean {
    return isAesGcmCiphertext(value) || isLegacyXorCiphertext(value);
}

export function isCipherCompatibleWithMode(value: string): boolean {
    if (SECURE_CRUD_CONFIG.mode === 'off') return true;
    if (SECURE_CRUD_CONFIG.mode === 'xor-v1') return isLegacyXorCiphertext(value);
    return isAesGcmCiphertext(value);
}

export function encryptString(plain: string, functionName?: string): string {
    if (!shouldApplySecurity(functionName)) return plain;
    if (!plain) return plain;
    if (isEncryptedString(plain)) {
        return plain;
    }

    if (SECURE_CRUD_CONFIG.mode === 'xor-v1') {
        const source = encoder.encode(plain);
        const key = encoder.encode(SECURE_CRUD_CONFIG.secretKey);
        const encrypted = xorWithKey(source, key);
        return `${LEGACY_XOR_PREFIX}${bytesToBase64(encrypted)}`;
    }

    return encryptStringAesGcm(plain);
}

export function decryptString(cipherOrPlain: string, functionName?: string): string {
    if (!shouldApplySecurity(functionName)) return cipherOrPlain;
    if (!cipherOrPlain) return cipherOrPlain;
    if (isAesGcmCiphertext(cipherOrPlain)) {
        try {
            return decryptStringAesGcm(cipherOrPlain);
        } catch {
            return cipherOrPlain;
        }
    }

    if (isLegacyXorCiphertext(cipherOrPlain)) {
        return decryptLegacyXorV1(cipherOrPlain);
    }

    if (SECURE_CRUD_CONFIG.rejectPlaintextRead) {
        throw new Error(
            `[secure-crud] Plaintext terdeteksi di hasil read${
                functionName ? ` (${functionName})` : ''
            }. Aktifkan migrasi data atau nonaktifkan REACT_APP_BLOCKCHAIN_CRUD_REJECT_PLAINTEXT_READ.`
        );
    }

    return cipherOrPlain;
}
