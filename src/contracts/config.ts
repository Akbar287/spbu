/**
 * Contract Configuration for SPBU Management Diamond Pattern
 * Contains all facet addresses and the MainDiamond proxy address
 * 
 * IMPORTANT: In Diamond Pattern, all calls go through MAIN_DIAMOND address.
 * The facet addresses are for reference only - you don't call them directly.
 */

// Import combined ABI for use in this file
import DiamondCombinedABI from './abis/DiamondCombined.json';

// Re-export all types from types/contracts
export * from '../types/contracts';

// Re-export all ABIs from abis/
export {
    AccessControlFacetABI,
    IdentityMemberFacetABI,
    IdentityNotifFacetABI,
    OrganizationFacetABI,
    HumanCapitalFacetABI,
    AssetCoreFacetABI,
    AssetFileFacetABI,
    InventoryCoreFacetABI,
    InventoryDocsFacetABI,
    InventoryTransferFacetABI,
    LogisticCoreFacetABI,
    LogisticFileFacetABI,
    AttendanceConfigFacetABI,
    AttendanceRecordFacetABI,
    PengadaanCoreFacetABI,
    PengadaanPaymentFacetABI,
    PointOfSalesCoreFacetABI,
    PointOfSalesSalesFacetABI,
    FinanceFacetABI,
    QualityControlFacetABI,
    DiamondCombinedABI,
} from './abis';

// ============================================================================
// NETWORK CONFIGURATION
// ============================================================================

export const NETWORK_CONFIG = {
    chainId: 1337,  // Ganache default
    rpcUrl: 'http://127.0.0.1:7545',
    networkName: 'Ganache Local',
} as const;

// ============================================================================
// CONTRACT ADDRESSES
// ============================================================================

// Main Diamond Proxy - ALL CALLS GO THROUGH THIS ADDRESS
export const DIAMOND_ADDRESS = '0x305afe61b4ad6af5ec1b67b28293e25a726088bf' as const;

// Facet addresses (for reference - not called directly)
export const FACET_ADDRESSES = {
    ACCESSCONTROL: "0x65ed563c0a857ce2e63b9a304fc54520222b2271",
    IDENTITY_MEMBER: "0x5baceda8773624a1c3ad012231e377ba20a3d681",
    IDENTITY_NOTIF: "0x60547c69f79f6dc3f8ac660924f91d1fad0086e3",
    ORGANIZATION: "0x6dba74163cd768f823de68df03895512e61b2e25",
    HUMAN_CAPITAL: "0x4bdf7b7f355ee615e83ac214fa2ec59a13d1cb04",
    ASSET_CORE: "0xecddc1dc96149f4d189c3ec5114e2c2e9ba08da1",
    ASSET_FILE: "0x007c4d5413763c7a1e3457fadf13c5c52baf13c5",
    INVENTORY_CORE: "0xed7831385e6a8aa8e78ab25dd5238e7e55b3ba12",
    INVENTORY_DOCS: "0x5f6f58b58e3f427e90fa2d81c5b1e74892ee8207",
    INVENTORY_TRANSFER: "0x2d35b57e5c76315ed2a25e98563cd7f5976984a5",
    LOGISTIC_CORE: "0xa5b3d9533cbee0c7067209d4d9b4119e7e95a313",
    LOGISTIC_FILE: "0x3a3803830e1308f0ff6d0763c82f337557a3f97a",
    ATTENDANCE_CONFIG: "0x9efb0c8bda8883513cc21d871bf22492a9565873",
    ATTENDANCE_RECORD: "0x74905351cea2d3c99a74632c24f013400e321929",
    PENGADAAN_CORE: "0xf1961c5049133b79e7cfbd45cc2eaeaa602d290c",
    PENGADAAN_PAYMENT: "0xb84f3aaedba226d8097e22801f2109ac3ffe26c9",
    POS_CORE: "0x01730ace6efc86cee39c5c9245600edc2ffb650b",
    POS_SALES: "0xb6427b2c8d06532f1e2d6916f3339cac709aa993",
    FINANCE: "0x1d4c27de810f7e1b458f04d4247486866f5f5978",
    QUALITY_CONTROL: "0x37d0bfd192e6dd21feffbfbd4c72451b5eeb036a"
} as const;

// Legacy aliases for backward compatibility
export const CONTRACT_ADDRESSES = {
    IDENTITY_CONTRACT: DIAMOND_ADDRESS,
    ORGANIZATION_CONTRACT: DIAMOND_ADDRESS,
    MAIN_DIAMOND: DIAMOND_ADDRESS,
} as const;

// ============================================================================
// COMBINED DIAMOND ABI
// ============================================================================

// All facet ABIs combined - use this for interacting with Diamond
export const DIAMOND_ABI = DiamondCombinedABI;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get Diamond contract config for viem
 * @returns Config object with address and ABI
 */
export const getDiamondConfig = () => ({
    address: DIAMOND_ADDRESS as `0x${string}`,
    abi: DIAMOND_ABI,
});

// Role constants (keccak256 hashes - must match contracts)
export const ROLES = {
    ADMIN_ROLE: '0xa49807205ce4d355092ef5a8a18f56e8913cf4a201fbe287825b095693c21775',
    OPERATOR_ROLE: '0x97667070c54ef182b0f5858b034beac1b6f3089aa2d3188bb1e8929f4fa9b929',
    DIREKTUR_ROLE: '0x2a9f6ecbff523453e5baa51e2eec02e7db64e7e4d3d9f3f0bdd5f75ed9e2b8e9',
    SUPERVISOR_ROLE: '0x73757065727669736f7200000000000000000000000000000000000000000000',
    KASIR_ROLE: '0x6b6173697200000000000000000000000000000000000000000000000000000000',
    OFFICEBOY_ROLE: '0x6f666669636562790000000000000000000000000000000000000000000000000',
    PARTNER_ROLE: '0x706172746e65720000000000000000000000000000000000000000000000000000',
} as const;

// ============================================================================
// ABI SELECTORS BY DOMAIN (for selective imports)
// ============================================================================

export const ABI_BY_DOMAIN = {
    accessControl: () => import('./abis/AccessControlFacet.json'),
    identity: () => Promise.all([
        import('./abis/IdentityMemberFacet.json'),
        import('./abis/IdentityNotifFacet.json'),
    ]),
    organization: () => Promise.all([
        import('./abis/OrganizationFacet.json'),
        import('./abis/HumanCapitalFacet.json'),
    ]),
    asset: () => Promise.all([
        import('./abis/AssetCoreFacet.json'),
        import('./abis/AssetFileFacet.json'),
    ]),
    inventory: () => Promise.all([
        import('./abis/InventoryCoreFacet.json'),
        import('./abis/InventoryDocsFacet.json'),
        import('./abis/InventoryTransferFacet.json'),
    ]),
    logistic: () => Promise.all([
        import('./abis/LogisticCoreFacet.json'),
        import('./abis/LogisticFileFacet.json'),
    ]),
    attendance: () => Promise.all([
        import('./abis/AttendanceConfigFacet.json'),
        import('./abis/AttendanceRecordFacet.json'),
    ]),
    pengadaan: () => Promise.all([
        import('./abis/PengadaanCoreFacet.json'),
        import('./abis/PengadaanPaymentFacet.json'),
    ]),
    pointOfSales: () => Promise.all([
        import('./abis/PointOfSalesCoreFacet.json'),
        import('./abis/PointOfSalesSalesFacet.json'),
    ]),
    finance: () => import('./abis/FinanceFacet.json'),
    qualityControl: () => import('./abis/QualityControlFacet.json'),
} as const;
