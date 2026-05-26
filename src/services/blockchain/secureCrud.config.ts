export type CrudCryptoMode = 'off' | 'xor-v1' | 'aes-gcm-v1';

export interface FunctionTransformRule {
    encryptArgs?: 'auto' | number[];
    encryptReadArgs?: boolean;
    decryptResult?: boolean;
}

export interface SecureCrudConfig {
    enabled: boolean;
    mode: CrudCryptoMode;
    secretKey: string;
    cipherPrefix: string;
    allowFallbackKey: boolean;
    strictWriteValidation: boolean;
    rejectPlaintextRead: boolean;
    defaultRule: Required<FunctionTransformRule>;
    functionRules: Record<string, FunctionTransformRule>;
}

const envEnabled = process.env.REACT_APP_BLOCKCHAIN_CRUD_ENCRYPTION_ENABLED;
const envMode = process.env.REACT_APP_BLOCKCHAIN_CRUD_ENCRYPTION_MODE as CrudCryptoMode | undefined;
const envSecret = process.env.REACT_APP_BLOCKCHAIN_CRUD_ENCRYPTION_KEY;
const envAllowFallbackKey = process.env.REACT_APP_BLOCKCHAIN_CRUD_ALLOW_FALLBACK_KEY;
const envStrictWriteValidation = process.env.REACT_APP_BLOCKCHAIN_CRUD_STRICT_WRITE_VALIDATION;
const envRejectPlaintextRead = process.env.REACT_APP_BLOCKCHAIN_CRUD_REJECT_PLAINTEXT_READ;

const fallbackSecret = `${process.env.REACT_APP_DIAMOND_ADDRESS || 'spbu'}-crud-secure-key`;
const allowFallbackKey = envAllowFallbackKey === 'true';

export const SECURE_CRUD_CONFIG: SecureCrudConfig = {
    enabled: envEnabled ? envEnabled === 'true' : true,
    mode: envMode || 'aes-gcm-v1',
    secretKey: envSecret || (allowFallbackKey ? fallbackSecret : ''),
    cipherPrefix: 'enc:aesgcm:v1:',
    allowFallbackKey,
    strictWriteValidation: envStrictWriteValidation ? envStrictWriteValidation === 'true' : true,
    rejectPlaintextRead: envRejectPlaintextRead ? envRejectPlaintextRead === 'true' : false,
    defaultRule: {
        encryptArgs: 'auto',
        encryptReadArgs: true,
        decryptResult: true,
    },
    functionRules: {
        // Add overrides per function when needed.
        // Example:
        // createHari: { encryptArgs: [0, 2] },
        // getHariById: { decryptResult: true, encryptReadArgs: false },
    },
};

let didWarnMissingSecret = false;

export function shouldApplySecurity(functionName?: string): boolean {
    if (!SECURE_CRUD_CONFIG.enabled || SECURE_CRUD_CONFIG.mode === 'off') return false;

    if (!SECURE_CRUD_CONFIG.secretKey) {
        throw new Error(
            '[secure-crud] REACT_APP_BLOCKCHAIN_CRUD_ENCRYPTION_KEY wajib diset saat enkripsi aktif. Atau set REACT_APP_BLOCKCHAIN_CRUD_ALLOW_FALLBACK_KEY=true untuk fallback non-produksi.'
        );
    }

    if (!process.env.REACT_APP_BLOCKCHAIN_CRUD_ENCRYPTION_KEY && SECURE_CRUD_CONFIG.allowFallbackKey && !didWarnMissingSecret) {
        didWarnMissingSecret = true;
        console.warn('[secure-crud] Menggunakan fallback key. Hindari di production.');
    }

    if (!functionName) return true;
    return true;
}

export function getFunctionRule(functionName?: string): Required<FunctionTransformRule> {
    const override = functionName ? SECURE_CRUD_CONFIG.functionRules[functionName] : undefined;
    return {
        ...SECURE_CRUD_CONFIG.defaultRule,
        ...(override || {}),
    };
}
