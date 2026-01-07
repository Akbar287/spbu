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
