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
    ACCESSCONTROL: "0xb106dc71790c8de1ae814a5540d4c2e1d246de42",
    IDENTITY_MEMBER: "0xeb28411707bdf62084ba148599255845737330de",
    IDENTITY_NOTIF: "0x60547c69f79f6dc3f8ac660924f91d1fad0086e3",
    ORGANIZATION: "0x4b5d8bc0d8f8d6f8db5ad5bd5adba060df037274",
    HUMAN_CAPITAL: "0x4bdf7b7f355ee615e83ac214fa2ec59a13d1cb04",
    ASSET_CORE: "0xecddc1dc96149f4d189c3ec5114e2c2e9ba08da1",
    ASSET_FILE: "0x007c4d5413763c7a1e3457fadf13c5c52baf13c5",
    INVENTORY_CORE: "0xed7831385e6a8aa8e78ab25dd5238e7e55b3ba12",
    INVENTORY_DOCS: "0x5d9c87d94dc1dff27318005a87f3244b861fb47d",
    INVENTORY_TRANSFER: "0x2d35b57e5c76315ed2a25e98563cd7f5976984a5",
    LOGISTIC_CORE: "0xa5b3d9533cbee0c7067209d4d9b4119e7e95a313",
    LOGISTIC_FILE: "0x3a3803830e1308f0ff6d0763c82f337557a3f97a",
    ATTENDANCE_CONFIG: "0x9efb0c8bda8883513cc21d871bf22492a9565873",
    ATTENDANCE_RECORD: "0x74905351cea2d3c99a74632c24f013400e321929",
    PENGADAAN_CORE: "0xf1961c5049133b79e7cfbd45cc2eaeaa602d290c",
    PENGADAAN_PAYMENT: "0xb84f3aaedba226d8097e22801f2109ac3ffe26c9",
    POS_CORE: "0x2209d6d08a67f8cccc602ef86d7117694ae5c88b",
    POS_SALES: "0xb6427b2c8d06532f1e2d6916f3339cac709aa993",
    FINANCE: "0x1d4c27de810f7e1b458f04d4247486866f5f5978",
    QUALITY_CONTROL: "0x37d0bfd192e6dd21feffbfbd4c72451b5eeb036a",
    CMS: "0xa466e40296c0cb90528c9ebaf15c2c8be994f017"
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

// Role hashes are now dynamically fetched from blockchain via jabatan.roleHash
// See OrganizationFacet.getJabatanRoleHash() and jabatan.roleHash field

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
