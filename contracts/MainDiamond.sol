// SPDX-License-Identifier: MIT
pragma solidity ^0.8.33;

import "./storage/AppStorage.sol";

/**
 * @title MainDiamond
 * @notice ERC-2535 Diamond Proxy Contract for SPBU Management System
 * @dev This is the central hub that delegates calls to various Facet contracts.
 *      All storage is kept in AppStorage using the diamond storage pattern.
 *
 * Key Features:
 * - Function selector routing via delegatecall
 * - Dynamic facet management (add/remove/replace)
 * - Ownership with transfer capability
 * - Supports loupe functions for introspection
 *
 * Facets:
 * - IdentityFacet: StatusMember, Ktp, AreaMember, Notifikasi
 * - OrganizationFacet: SPBU, Divisi, Level, Jabatan
 * - AttendanceFacet: StatusPresensi, StatusKehadiran, Hari, JamKerja, Penjadwalan, Presensi
 * - HumanCapitalFacet: Gaji, GajiWallet, DetailGaji, Bonus
 * - AsetManagementFacet: StatusAset, Aset, TransferAset, FileAset, AsetOpname
 * - InventoryFacet: Produk, Dombak, StokInventory, DokumenStok, Konversi, Losses, etc.
 * - LogisticFacet: Ms2, Pengiriman, Supir, FileLo, Segel, Penerimaan
 * - PengadaanFacet: StatusPurchase, RencanaPembelian, DetailRencanaPembelian, Pembayaran
 * - PointOfSalesFacet: StatusSetoran, Harga, Payung, Dispenser, Nozzle, Penjualan
 * - FinanceFacet: PettyCash, Penarikan, PenjualanPenarikan
 * - QualityControlFacet: Tera, DetailTera, TeraReturn
 * - CmsFacet: Tag, Artikel, Artikel-Kategori Relation, Artikel-Tag Relation
 */
contract MainDiamond {
    // ==================== Events ====================

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
    event FacetAdded(address indexed facetAddress, bytes4[] selectors);
    event FacetRemoved(address indexed facetAddress, bytes4[] selectors);
    event FacetReplaced(
        address indexed oldFacet,
        address indexed newFacet,
        bytes4[] selectors
    );
    event SelectorUpdated(
        bytes4 indexed selector,
        address indexed oldFacet,
        address indexed newFacet
    );

    // ==================== Errors ====================

    error NotOwner();
    error FunctionNotFound(bytes4 selector);
    error InvalidFacetAddress();
    error SelectorAlreadyExists(bytes4 selector);
    error SelectorNotFound(bytes4 selector);
    error NoSelectorsProvided();

    // ==================== State Variables ====================

    // Contract owner (initially deployer)
    address public owner;

    // Pending owner for two-step ownership transfer
    address public pendingOwner;

    // Mapping from function selector to facet address
    mapping(bytes4 => address) public selectorToFacet;

    // Array of all registered selectors (for loupe)
    bytes4[] public allSelectors;

    // Mapping from facet address to its selectors (for loupe)
    mapping(address => bytes4[]) public facetToSelectors;

    // Array of all facet addresses (for loupe)
    address[] public allFacets;

    // Mapping to check if facet exists
    mapping(address => bool) public facetExists;

    // ==================== Constructor ====================

    constructor() {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);
    }

    // ==================== Modifiers ====================

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ==================== Ownership Functions ====================

    /**
     * @notice Initiate ownership transfer (two-step process)
     * @param _newOwner Address of the new owner
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "Diamond: Zero address");
        pendingOwner = _newOwner;
    }

    /**
     * @notice Accept ownership transfer
     */
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Diamond: Not pending owner");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }

    // ==================== Facet Management ====================

    /**
     * @notice Add a new facet with its function selectors
     * @param _facetAddress Address of the deployed facet contract
     * @param _selectors Array of function selectors to register
     */
    function addFacet(
        address _facetAddress,
        bytes4[] calldata _selectors
    ) external onlyOwner {
        if (_facetAddress == address(0)) revert InvalidFacetAddress();
        if (_selectors.length == 0) revert NoSelectorsProvided();

        // Add facet to registry if new
        if (!facetExists[_facetAddress]) {
            allFacets.push(_facetAddress);
            facetExists[_facetAddress] = true;
        }

        for (uint256 i = 0; i < _selectors.length; i++) {
            bytes4 selector = _selectors[i];

            // Check if selector already registered
            if (selectorToFacet[selector] != address(0)) {
                revert SelectorAlreadyExists(selector);
            }

            selectorToFacet[selector] = _facetAddress;
            allSelectors.push(selector);
            facetToSelectors[_facetAddress].push(selector);
        }

        emit FacetAdded(_facetAddress, _selectors);
    }

    /**
     * @notice Replace selectors from one facet to another
     * @param _oldFacet Address of the old facet (use address(0) to add new)
     * @param _newFacet Address of the new facet
     * @param _selectors Array of function selectors to update
     */
    function replaceFacet(
        address _oldFacet,
        address _newFacet,
        bytes4[] calldata _selectors
    ) external onlyOwner {
        if (_newFacet == address(0)) revert InvalidFacetAddress();
        if (_selectors.length == 0) revert NoSelectorsProvided();

        // Add new facet to registry if new
        if (!facetExists[_newFacet]) {
            allFacets.push(_newFacet);
            facetExists[_newFacet] = true;
        }

        for (uint256 i = 0; i < _selectors.length; i++) {
            bytes4 selector = _selectors[i];
            address currentFacet = selectorToFacet[selector];

            // Verify old facet matches (if specified)
            if (_oldFacet != address(0) && currentFacet != _oldFacet) {
                revert SelectorNotFound(selector);
            }

            // Update selector mapping
            selectorToFacet[selector] = _newFacet;

            // If this is a new selector, add to allSelectors
            if (currentFacet == address(0)) {
                allSelectors.push(selector);
            }

            // Update facetToSelectors
            facetToSelectors[_newFacet].push(selector);

            emit SelectorUpdated(selector, currentFacet, _newFacet);
        }

        emit FacetReplaced(_oldFacet, _newFacet, _selectors);
    }

    /**
     * @notice Remove selectors (set facet to address(0))
     * @param _selectors Array of function selectors to remove
     */
    function removeSelectors(bytes4[] calldata _selectors) external onlyOwner {
        if (_selectors.length == 0) revert NoSelectorsProvided();

        for (uint256 i = 0; i < _selectors.length; i++) {
            bytes4 selector = _selectors[i];
            address facet = selectorToFacet[selector];

            if (facet == address(0)) {
                revert SelectorNotFound(selector);
            }

            selectorToFacet[selector] = address(0);

            emit SelectorUpdated(selector, facet, address(0));
        }
    }

    /**
     * @notice Batch update facet - legacy compatibility function
     * @param _facetAddress Address of the facet
     * @param _selectors Array of function selectors
     */
    function updateFacet(
        address _facetAddress,
        bytes4[] calldata _selectors
    ) external onlyOwner {
        if (_facetAddress == address(0)) revert InvalidFacetAddress();
        if (_selectors.length == 0) revert NoSelectorsProvided();

        // Add facet to registry if new
        if (!facetExists[_facetAddress]) {
            allFacets.push(_facetAddress);
            facetExists[_facetAddress] = true;
        }

        for (uint256 i = 0; i < _selectors.length; i++) {
            bytes4 selector = _selectors[i];
            address oldFacet = selectorToFacet[selector];

            selectorToFacet[selector] = _facetAddress;

            // Add to allSelectors if new
            if (oldFacet == address(0)) {
                allSelectors.push(selector);
            }

            facetToSelectors[_facetAddress].push(selector);
        }

        emit FacetAdded(_facetAddress, _selectors);
    }

    // ==================== Loupe Functions (ERC-2535 DiamondLoupe) ====================

    /**
     * @notice Get all facet addresses
     * @return Array of all registered facet addresses
     */
    function facets() external view returns (address[] memory) {
        return allFacets;
    }

    /**
     * @notice Get all function selectors for a facet
     * @param _facet Address of the facet
     * @return Array of function selectors
     */
    function facetFunctionSelectors(
        address _facet
    ) external view returns (bytes4[] memory) {
        return facetToSelectors[_facet];
    }

    /**
     * @notice Get the facet address for a function selector
     * @param _selector Function selector
     * @return Facet address (address(0) if not found)
     */
    function facetAddress(bytes4 _selector) external view returns (address) {
        return selectorToFacet[_selector];
    }

    /**
     * @notice Get all registered function selectors
     * @return Array of all function selectors
     */
    function getAllSelectors() external view returns (bytes4[] memory) {
        return allSelectors;
    }

    /**
     * @notice Get total number of registered selectors
     * @return Count of selectors
     */
    function getSelectorCount() external view returns (uint256) {
        return allSelectors.length;
    }

    /**
     * @notice Get total number of facets
     * @return Count of facets
     */
    function getFacetCount() external view returns (uint256) {
        return allFacets.length;
    }

    // ==================== Fallback & Receive ====================

    /**
     * @notice Fallback function - routes calls to appropriate facet
     * @dev Uses delegatecall to execute function in facet context with Diamond's storage
     */
    fallback() external payable {
        address facet = selectorToFacet[msg.sig];
        if (facet == address(0)) revert FunctionNotFound(msg.sig);

        // Execute function on facet using Diamond's storage context
        assembly {
            // Copy calldata to memory
            calldatacopy(0, 0, calldatasize())

            // Delegatecall to facet
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)

            // Copy return data to memory
            returndatacopy(0, 0, returndatasize())

            // Return or revert based on result
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    /**
     * @notice Receive function to accept ETH
     */
    receive() external payable {}
}
