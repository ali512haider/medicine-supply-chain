// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ─────────────────────────────────────────────────────────────────────────────
// Interface — RegistryContract
// ─────────────────────────────────────────────────────────────────────────────

import "./IRegistry.sol";

// ─────────────────────────────────────────────────────────────────────────────
// Interface — ProductContract
// ─────────────────────────────────────────────────────────────────────────────

import "./IProduct.sol";

// ─────────────────────────────────────────────────────────────────────────────
// Interface — TraceContract  (forward declaration — set after deploy)
// ─────────────────────────────────────────────────────────────────────────────

interface ITrace {
    function recordEvent(
        string  calldata _batchNumber,
        address          _actor,
        string  calldata _action,
        uint256          _quantity,
        string  calldata _note
    ) external;
}

// ─────────────────────────────────────────────────────────────────────────────
// TransferContract
// ─────────────────────────────────────────────────────────────────────────────

/// @title  TransferContract
/// @notice Handles every custody movement in the medicine supply chain:
///           Manufacturer → Distributor → Supplier → Pharmacist → Buyer
///         Also manages the supply-chain whitelists (who can supply whom),
///         transfer request workflows, and expired-stock return flows.
///         Calls ProductContract.adjustStock() and ITrace.recordEvent()
///         on every movement so the full audit trail is maintained.
contract TransferContract {

    // ─────────────────────────────────────────────────────────────
    // Contract references
    // ─────────────────────────────────────────────────────────────

    IRegistry public immutable registry;
    IProduct  public immutable product;
    ITrace    public            trace;          // set post-deploy (circular dep)
    bool      public            traceSet;

    // ─────────────────────────────────────────────────────────────
    // Enums
    // ─────────────────────────────────────────────────────────────

    enum TransferStatus {
        Pending,    // 0 – request raised, awaiting acceptance
        Accepted,   // 1 – receiver confirmed; stock moved on-chain
        Rejected,   // 2 – receiver declined the transfer
        Cancelled   // 3 – sender cancelled before acceptance
    }

    enum TransferDirection {
        ManufacturerToDistributor,  // 0
        DistributorToSupplier,      // 1
        SupplierToPharmacist,       // 2
        PharmacistToBuyer           // 3  (sale — no on-chain buyer identity)
    }

    // ─────────────────────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────────────────────

    struct TransferRequest {
        uint256           id;
        TransferDirection direction;
        TransferStatus    status;
        string            batchNumber;
        address           sender;
        address           receiver;         // address(0) for Buyer sales
        uint256           quantity;
        uint256           pricePerUnit;     // agreed price for this leg
        string            currency;
        string            note;             // optional delivery note
        uint256           createdAt;
        uint256           resolvedAt;       // 0 until Accepted / Rejected / Cancelled
        bytes32           transferHash;     // keccak256 fingerprint stored on-chain
    }

    struct SaleRecord {
        uint256 saleId;
        string  batchNumber;
        address pharmacist;
        uint256 quantity;
        uint256 pricePerUnit;
        string  currency;
        string  buyerNote;      // optional (name / prescription ref — NOT identity)
        uint256 soldAt;
        bytes32 saleHash;
    }

    // ─────────────────────────────────────────────────────────────
    // Whitelists  (who is allowed to supply whom)
    // ─────────────────────────────────────────────────────────────

    // manufacturer  → set of distributors it has authorised
    mapping(address => mapping(address => bool)) private mfrToDistributor;
    mapping(address => address[])                private mfrDistributorList;

    // distributor   → set of suppliers it has authorised
    mapping(address => mapping(address => bool)) private distToSupplier;
    mapping(address => address[])                private distSupplierList;

    // supplier      → set of pharmacists it has authorised
    mapping(address => mapping(address => bool)) private suppToPharmacist;
    mapping(address => address[])                private suppPharmacistList;

    // ─────────────────────────────────────────────────────────────
    // Transfer Requests
    // ─────────────────────────────────────────────────────────────

    uint256 private nextTransferId = 1;

    mapping(uint256 => TransferRequest) private transfers;

    // per-sender and per-receiver indexes for dashboard queries
    mapping(address => uint256[]) private senderTransfers;
    mapping(address => uint256[]) private receiverTransfers;

    // per-batch index
    mapping(string => uint256[]) private batchTransfers;

    // ─────────────────────────────────────────────────────────────
    // Sales
    // ─────────────────────────────────────────────────────────────

    uint256 private nextSaleId = 1;

    mapping(uint256 => SaleRecord)  private sales;
    mapping(address => uint256[])   private pharmacistSales;   // pharmacist → saleIds
    mapping(string  => uint256[])   private batchSales;        // batchNo    → saleIds

    // ─────────────────────────────────────────────────────────────
    // Ownership snapshot  (latest confirmed holder per batch)
    // ─────────────────────────────────────────────────────────────

    // Tracks the most recent confirmed custodian for a batch at each level.
    // Used by Trace and the frontend "current owner" display.
    mapping(string => address) private currentOwner;

    // Full ordered custody chain: batchNo → ordered list of (address, timestamp)
    struct CustodyEntry {
        address holder;
        uint256 timestamp;
        string  action;
    }
    mapping(string => CustodyEntry[]) private custodyChain;

    // ─────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────

    // Whitelists
    event DistributorAdded(address indexed manufacturer, address indexed distributor, uint256 timestamp);
    event DistributorRemoved(address indexed manufacturer, address indexed distributor, uint256 timestamp);
    event SupplierAdded(address indexed distributor, address indexed supplier, uint256 timestamp);
    event SupplierRemoved(address indexed distributor, address indexed supplier, uint256 timestamp);
    event PharmacistAdded(address indexed supplier, address indexed pharmacist, uint256 timestamp);
    event PharmacistRemoved(address indexed supplier, address indexed pharmacist, uint256 timestamp);

    // Transfer lifecycle
    event TransferRequested(
        uint256 indexed transferId,
        TransferDirection direction,
        string  indexed batchNumber,
        address indexed sender,
        address         receiver,
        uint256         quantity,
        uint256         timestamp
    );
    event TransferAccepted(
        uint256 indexed transferId,
        address indexed receiver,
        bytes32         transferHash,
        uint256         timestamp
    );
    event TransferRejected(
        uint256 indexed transferId,
        address indexed receiver,
        string          reason,
        uint256         timestamp
    );
    event TransferCancelled(
        uint256 indexed transferId,
        address indexed sender,
        uint256         timestamp
    );

    // Sales
    event MedicineSold(
        uint256 indexed saleId,
        string  indexed batchNumber,
        address indexed pharmacist,
        uint256         quantity,
        bytes32         saleHash,
        uint256         timestamp
    );

    // Ownership
    event OwnershipUpdated(
        string  indexed batchNumber,
        address indexed previousOwner,
        address indexed newOwner,
        uint256         timestamp
    );

    // TraceContract link
    event TraceContractSet(address indexed traceAddress, uint256 timestamp);

    // ─────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        require(msg.sender == registry.admin(), "Transfer: not admin");
        _;
    }

    modifier onlyApprovedRole(IRegistry.Role _role) {
        require(
            registry.isApprovedWithRole(msg.sender, _role),
            "Transfer: caller does not have the required approved role"
        );
        _;
    }

    modifier transferExists(uint256 _id) {
        require(transfers[_id].createdAt != 0, "Transfer: request does not exist");
        _;
    }

    modifier onlyPending(uint256 _id) {
        require(
            transfers[_id].status == TransferStatus.Pending,
            "Transfer: request is not Pending"
        );
        _;
    }

    // ─────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────

    constructor(address _registry, address _product) {
        require(_registry != address(0), "Transfer: zero registry");
        require(_product  != address(0), "Transfer: zero product");
        registry = IRegistry(_registry);
        product  = IProduct(_product);
    }

    // ─────────────────────────────────────────────────────────────
    // Link TraceContract  (set once after TraceContract is deployed)
    // ─────────────────────────────────────────────────────────────

    /// @notice Called by admin after TraceContract is deployed.
    ///         Can only be set once to prevent hijacking.
    function setTraceContract(address _trace) external onlyAdmin {
        require(!traceSet,          "Transfer: trace already set");
        require(_trace != address(0), "Transfer: zero trace address");
        trace    = ITrace(_trace);
        traceSet = true;
        emit TraceContractSet(_trace, block.timestamp);
    }

    // ═════════════════════════════════════════════════════════════
    // SECTION 1 — WHITELIST MANAGEMENT
    // ═════════════════════════════════════════════════════════════

    // ── Manufacturer manages Distributors ────────────────────────

    /// @notice Manufacturer adds an approved Distributor to its supply network.
    function addDistributor(address _distributor)
        external
        onlyApprovedRole(IRegistry.Role.Manufacturer)
    {
        require(
            registry.isApprovedWithRole(_distributor, IRegistry.Role.Distributor),
            "Transfer: target is not an approved distributor"
        );
        require(!mfrToDistributor[msg.sender][_distributor], "Transfer: already added");

        mfrToDistributor[msg.sender][_distributor] = true;
        mfrDistributorList[msg.sender].push(_distributor);

        emit DistributorAdded(msg.sender, _distributor, block.timestamp);
    }

    /// @notice Manufacturer removes a Distributor from its supply network.
    function removeDistributor(address _distributor)
        external
        onlyApprovedRole(IRegistry.Role.Manufacturer)
    {
        require(mfrToDistributor[msg.sender][_distributor], "Transfer: not in list");
        mfrToDistributor[msg.sender][_distributor] = false;
        _removeFromList(mfrDistributorList[msg.sender], _distributor);
        emit DistributorRemoved(msg.sender, _distributor, block.timestamp);
    }

    // ── Distributor manages Suppliers ────────────────────────────

    /// @notice Distributor adds an approved Supplier to its network.
    function addSupplier(address _supplier)
        external
        onlyApprovedRole(IRegistry.Role.Distributor)
    {
        require(
            registry.isApprovedWithRole(_supplier, IRegistry.Role.Supplier),
            "Transfer: target is not an approved supplier"
        );
        require(!distToSupplier[msg.sender][_supplier], "Transfer: already added");

        distToSupplier[msg.sender][_supplier] = true;
        distSupplierList[msg.sender].push(_supplier);

        emit SupplierAdded(msg.sender, _supplier, block.timestamp);
    }

    /// @notice Distributor removes a Supplier from its network.
    function removeSupplier(address _supplier)
        external
        onlyApprovedRole(IRegistry.Role.Distributor)
    {
        require(distToSupplier[msg.sender][_supplier], "Transfer: not in list");
        distToSupplier[msg.sender][_supplier] = false;
        _removeFromList(distSupplierList[msg.sender], _supplier);
        emit SupplierRemoved(msg.sender, _supplier, block.timestamp);
    }

    // ── Supplier manages Pharmacists ─────────────────────────────

    /// @notice Supplier adds an approved Pharmacist to its network.
    function addPharmacist(address _pharmacist)
        external
        onlyApprovedRole(IRegistry.Role.Supplier)
    {
        require(
            registry.isApprovedWithRole(_pharmacist, IRegistry.Role.Pharmacist),
            "Transfer: target is not an approved pharmacist"
        );
        require(!suppToPharmacist[msg.sender][_pharmacist], "Transfer: already added");

        suppToPharmacist[msg.sender][_pharmacist] = true;
        suppPharmacistList[msg.sender].push(_pharmacist);

        emit PharmacistAdded(msg.sender, _pharmacist, block.timestamp);
    }

    /// @notice Supplier removes a Pharmacist from its network.
    function removePharmacist(address _pharmacist)
        external
        onlyApprovedRole(IRegistry.Role.Supplier)
    {
        require(suppToPharmacist[msg.sender][_pharmacist], "Transfer: not in list");
        suppToPharmacist[msg.sender][_pharmacist] = false;
        _removeFromList(suppPharmacistList[msg.sender], _pharmacist);
        emit PharmacistRemoved(msg.sender, _pharmacist, block.timestamp);
    }

    // ═════════════════════════════════════════════════════════════
    // SECTION 2 — TRANSFER REQUEST WORKFLOW
    // Sender raises a request → Receiver accepts (stock moves) or rejects
    // ═════════════════════════════════════════════════════════════

    // ── Manufacturer → Distributor ───────────────────────────────

    /// @notice Manufacturer raises a transfer request to a whitelisted Distributor.
    function requestTransferToDistributor(
        string  calldata _batchNumber,
        address          _distributor,
        uint256          _quantity,
        uint256          _pricePerUnit,
        string  calldata _currency,
        string  calldata _note
    )
        external
        onlyApprovedRole(IRegistry.Role.Manufacturer)
        returns (uint256 transferId)
    {
        require(product.batchExistsCheck(_batchNumber),        "Transfer: batch not found");
        require(product.isBatchValid(_batchNumber),            "Transfer: batch is not Active/valid");
        require(mfrToDistributor[msg.sender][_distributor],    "Transfer: distributor not in whitelist");
        require(_quantity > 0,                                 "Transfer: zero quantity");
        require(
            product.getStockOf(_batchNumber, msg.sender) >= _quantity,
            "Transfer: insufficient manufacturer stock"
        );

        transferId = _createTransferRequest(
            TransferDirection.ManufacturerToDistributor,
            _batchNumber,
            msg.sender,
            _distributor,
            _quantity,
            _pricePerUnit,
            _currency,
            _note
        );
    }

    // ── Distributor → Supplier ────────────────────────────────────

    /// @notice Distributor raises a transfer request to a whitelisted Supplier.
    function requestTransferToSupplier(
        string  calldata _batchNumber,
        address          _supplier,
        uint256          _quantity,
        uint256          _pricePerUnit,
        string  calldata _currency,
        string  calldata _note
    )
        external
        onlyApprovedRole(IRegistry.Role.Distributor)
        returns (uint256 transferId)
    {
        require(product.batchExistsCheck(_batchNumber),       "Transfer: batch not found");
        require(product.isBatchValid(_batchNumber),           "Transfer: batch is not Active/valid");
        require(distToSupplier[msg.sender][_supplier],        "Transfer: supplier not in whitelist");
        require(_quantity > 0,                                "Transfer: zero quantity");
        require(
            product.getStockOf(_batchNumber, msg.sender) >= _quantity,
            "Transfer: insufficient distributor stock"
        );

        transferId = _createTransferRequest(
            TransferDirection.DistributorToSupplier,
            _batchNumber,
            msg.sender,
            _supplier,
            _quantity,
            _pricePerUnit,
            _currency,
            _note
        );
    }

    // ── Supplier → Pharmacist ─────────────────────────────────────

    /// @notice Supplier raises a transfer request to a whitelisted Pharmacist.
    function requestTransferToPharmacist(
        string  calldata _batchNumber,
        address          _pharmacist,
        uint256          _quantity,
        uint256          _pricePerUnit,
        string  calldata _currency,
        string  calldata _note
    )
        external
        onlyApprovedRole(IRegistry.Role.Supplier)
        returns (uint256 transferId)
    {
        require(product.batchExistsCheck(_batchNumber),       "Transfer: batch not found");
        require(product.isBatchValid(_batchNumber),           "Transfer: batch is not Active/valid");
        require(suppToPharmacist[msg.sender][_pharmacist],    "Transfer: pharmacist not in whitelist");
        require(_quantity > 0,                                "Transfer: zero quantity");
        require(
            product.getStockOf(_batchNumber, msg.sender) >= _quantity,
            "Transfer: insufficient supplier stock"
        );

        transferId = _createTransferRequest(
            TransferDirection.SupplierToPharmacist,
            _batchNumber,
            msg.sender,
            _pharmacist,
            _quantity,
            _pricePerUnit,
            _currency,
            _note
        );
    }

    // ── Accept Transfer (Receiver confirms) ──────────────────────

    /// @notice Receiver accepts the transfer. This is the moment stock actually moves.
    /// @dev    Receiver must be the intended receiver on the request.
    ///         Calls ProductContract.adjustStock() and TraceContract.recordEvent().
    function acceptTransfer(uint256 _transferId, string calldata _note)
        external
        transferExists(_transferId)
        onlyPending(_transferId)
    {
        TransferRequest storage req = transfers[_transferId];
        require(msg.sender == req.receiver, "Transfer: caller is not the intended receiver");
        require(
            registry.isApproved(msg.sender),
            "Transfer: receiver is no longer an approved entity"
        );

        // Re-check stock hasn't dropped below required quantity since request was made
        require(
            product.getStockOf(req.batchNumber, req.sender) >= req.quantity,
            "Transfer: sender stock insufficient at time of acceptance"
        );

        // ── Move stock in ProductContract ────────────────────────
        product.adjustStock(req.batchNumber, req.sender, req.receiver, req.quantity);

        // ── Build transfer hash ──────────────────────────────────
        bytes32 tHash = keccak256(abi.encodePacked(
            _transferId,
            req.batchNumber,
            req.sender,
            req.receiver,
            req.quantity,
            block.timestamp
        ));

        // ── Update request record ────────────────────────────────
        req.status       = TransferStatus.Accepted;
        req.resolvedAt   = block.timestamp;
        req.transferHash = tHash;

        // ── Update ownership snapshot ────────────────────────────
        address previousOwner = currentOwner[req.batchNumber];
        currentOwner[req.batchNumber] = req.receiver;

        custodyChain[req.batchNumber].push(CustodyEntry({
            holder:    req.receiver,
            timestamp: block.timestamp,
            action:    _directionLabel(req.direction)
        }));

        // ── Notify TraceContract ─────────────────────────────────
        if (traceSet) {
            trace.recordEvent(
                req.batchNumber,
                req.receiver,
                _directionLabel(req.direction),
                req.quantity,
                _note
            );
        }

        emit TransferAccepted(_transferId, req.receiver, tHash, block.timestamp);
        emit OwnershipUpdated(req.batchNumber, previousOwner, req.receiver, block.timestamp);
    }

    // ── Reject Transfer ───────────────────────────────────────────

    /// @notice Receiver rejects the transfer request. Stock does not move.
    function rejectTransfer(uint256 _transferId, string calldata _reason)
        external
        transferExists(_transferId)
        onlyPending(_transferId)
    {
        TransferRequest storage req = transfers[_transferId];
        require(msg.sender == req.receiver, "Transfer: caller is not the intended receiver");
        require(bytes(_reason).length > 0,  "Transfer: reason required");

        req.status     = TransferStatus.Rejected;
        req.resolvedAt = block.timestamp;
        req.note       = _reason;

        emit TransferRejected(_transferId, msg.sender, _reason, block.timestamp);
    }

    // ── Cancel Transfer (Sender withdraws) ───────────────────────

    /// @notice Sender cancels a Pending request before the receiver acts.
    function cancelTransfer(uint256 _transferId)
        external
        transferExists(_transferId)
        onlyPending(_transferId)
    {
        TransferRequest storage req = transfers[_transferId];
        require(msg.sender == req.sender, "Transfer: caller is not the sender");

        req.status     = TransferStatus.Cancelled;
        req.resolvedAt = block.timestamp;

        emit TransferCancelled(_transferId, msg.sender, block.timestamp);
    }

    // ═════════════════════════════════════════════════════════════
    // SECTION 3 — DIRECT TRANSFER (no request/accept — one-step)
    // Used when both parties are co-operating instantly (e.g. in a demo
    // or when sender IS the contract owner / admin for testing).
    // Can be disabled by the admin via the modifier if needed.
    // ═════════════════════════════════════════════════════════════

    /// @notice One-step transfer: Manufacturer sends directly to Distributor.
    ///         No pending state — stock moves immediately.
    ///         Use requestTransferToDistributor / acceptTransfer for production.
    function directTransferToDistributor(
        string  calldata _batchNumber,
        address          _distributor,
        uint256          _quantity,
        string  calldata _note
    )
        external
        onlyApprovedRole(IRegistry.Role.Manufacturer)
    {
        require(product.batchExistsCheck(_batchNumber),     "Transfer: batch not found");
        require(product.isBatchValid(_batchNumber),         "Transfer: batch not valid");
        require(mfrToDistributor[msg.sender][_distributor], "Transfer: not whitelisted");
        require(_quantity > 0,                              "Transfer: zero quantity");
        require(
            product.getStockOf(_batchNumber, msg.sender) >= _quantity,
            "Transfer: insufficient stock"
        );

        _executeTransfer(
            _batchNumber, msg.sender, _distributor, _quantity,
            TransferDirection.ManufacturerToDistributor, _note
        );
    }

    /// @notice One-step transfer: Distributor sends directly to Supplier.
    function directTransferToSupplier(
        string  calldata _batchNumber,
        address          _supplier,
        uint256          _quantity,
        string  calldata _note
    )
        external
        onlyApprovedRole(IRegistry.Role.Distributor)
    {
        require(product.batchExistsCheck(_batchNumber),   "Transfer: batch not found");
        require(product.isBatchValid(_batchNumber),       "Transfer: batch not valid");
        require(distToSupplier[msg.sender][_supplier],    "Transfer: not whitelisted");
        require(_quantity > 0,                            "Transfer: zero quantity");
        require(
            product.getStockOf(_batchNumber, msg.sender) >= _quantity,
            "Transfer: insufficient stock"
        );

        _executeTransfer(
            _batchNumber, msg.sender, _supplier, _quantity,
            TransferDirection.DistributorToSupplier, _note
        );
    }

    /// @notice One-step transfer: Supplier sends directly to Pharmacist.
    function directTransferToPharmacist(
        string  calldata _batchNumber,
        address          _pharmacist,
        uint256          _quantity,
        string  calldata _note
    )
        external
        onlyApprovedRole(IRegistry.Role.Supplier)
    {
        require(product.batchExistsCheck(_batchNumber),       "Transfer: batch not found");
        require(product.isBatchValid(_batchNumber),           "Transfer: batch not valid");
        require(suppToPharmacist[msg.sender][_pharmacist],    "Transfer: not whitelisted");
        require(_quantity > 0,                                "Transfer: zero quantity");
        require(
            product.getStockOf(_batchNumber, msg.sender) >= _quantity,
            "Transfer: insufficient stock"
        );

        _executeTransfer(
            _batchNumber, msg.sender, _pharmacist, _quantity,
            TransferDirection.SupplierToPharmacist, _note
        );
    }

    // ═════════════════════════════════════════════════════════════
    // SECTION 4 — PHARMACIST SALE TO BUYER
    // ═════════════════════════════════════════════════════════════

    /// @notice Pharmacist records a sale to a customer.
    ///         No on-chain buyer identity — only quantity, price, and an
    ///         optional note (e.g. prescription reference number).
    function sellToBuyer(
        string  calldata _batchNumber,
        uint256          _quantity,
        uint256          _pricePerUnit,
        string  calldata _currency,
        string  calldata _buyerNote
    )
        external
        onlyApprovedRole(IRegistry.Role.Pharmacist)
    {
        require(product.batchExistsCheck(_batchNumber),    "Transfer: batch not found");
        require(product.isBatchValid(_batchNumber),        "Transfer: batch not valid/expired");
        require(_quantity > 0,                             "Transfer: zero quantity");
        require(
            product.getStockOf(_batchNumber, msg.sender) >= _quantity,
            "Transfer: insufficient pharmacist stock"
        );

        // Deduct from ProductContract
        product.deductSale(_batchNumber, msg.sender, _quantity);

        // Build sale hash
        bytes32 sHash = keccak256(abi.encodePacked(
            nextSaleId,
            _batchNumber,
            msg.sender,
            _quantity,
            block.timestamp
        ));

        // Record sale
        SaleRecord storage sr = sales[nextSaleId];
        sr.saleId       = nextSaleId;
        sr.batchNumber  = _batchNumber;
        sr.pharmacist   = msg.sender;
        sr.quantity     = _quantity;
        sr.pricePerUnit = _pricePerUnit;
        sr.currency     = _currency;
        sr.buyerNote    = _buyerNote;
        sr.soldAt       = block.timestamp;
        sr.saleHash     = sHash;

        pharmacistSales[msg.sender].push(nextSaleId);
        batchSales[_batchNumber].push(nextSaleId);

        emit MedicineSold(nextSaleId, _batchNumber, msg.sender, _quantity, sHash, block.timestamp);

        // Notify TraceContract
        if (traceSet) {
            trace.recordEvent(
                _batchNumber,
                msg.sender,
                "PharmacistToBuyer",
                _quantity,
                _buyerNote
            );
        }

        nextSaleId++;
    }

    // ═════════════════════════════════════════════════════════════
    // SECTION 5 — EXPIRED STOCK RETURNS
    // ═════════════════════════════════════════════════════════════

    /// @notice Pharmacist returns expired stock to Supplier.
    ///         Moves the quantity back up the chain for disposal tracking.
    function returnExpiredToSupplier(
        string  calldata _batchNumber,
        address          _supplier,
        uint256          _quantity,
        string  calldata _note
    )
        external
        onlyApprovedRole(IRegistry.Role.Pharmacist)
    {
        require(product.batchExistsCheck(_batchNumber),     "Transfer: batch not found");
        require(!product.isBatchValid(_batchNumber),         "Transfer: batch is still valid");
        require(suppToPharmacist[_supplier][msg.sender],     "Transfer: not linked to supplier");
        require(_quantity > 0,                               "Transfer: zero quantity");
        require(
            product.getStockOf(_batchNumber, msg.sender) >= _quantity,
            "Transfer: insufficient expired stock"
        );

        product.adjustStock(_batchNumber, msg.sender, _supplier, _quantity);

        if (traceSet) {
            trace.recordEvent(
                _batchNumber, msg.sender,
                "ExpiredReturnPharmacistToSupplier", _quantity, _note
            );
        }

        _recordCustodyEntry(_batchNumber, _supplier, "ExpiredReturn-Supplier");
        emit OwnershipUpdated(_batchNumber, msg.sender, _supplier, block.timestamp);
    }

    /// @notice Supplier returns expired stock to Distributor.
    function returnExpiredToDistributor(
        string  calldata _batchNumber,
        address          _distributor,
        uint256          _quantity,
        string  calldata _note
    )
        external
        onlyApprovedRole(IRegistry.Role.Supplier)
    {
        require(product.batchExistsCheck(_batchNumber),      "Transfer: batch not found");
        require(!product.isBatchValid(_batchNumber),          "Transfer: batch is still valid");
        require(distToSupplier[_distributor][msg.sender],     "Transfer: not linked to distributor");
        require(_quantity > 0,                                "Transfer: zero quantity");
        require(
            product.getStockOf(_batchNumber, msg.sender) >= _quantity,
            "Transfer: insufficient expired stock"
        );

        product.adjustStock(_batchNumber, msg.sender, _distributor, _quantity);

        if (traceSet) {
            trace.recordEvent(
                _batchNumber, msg.sender,
                "ExpiredReturnSupplierToDistributor", _quantity, _note
            );
        }

        _recordCustodyEntry(_batchNumber, _distributor, "ExpiredReturn-Distributor");
        emit OwnershipUpdated(_batchNumber, msg.sender, _distributor, block.timestamp);
    }

    /// @notice Distributor returns expired stock to Manufacturer.
    function returnExpiredToManufacturer(
        string  calldata _batchNumber,
        address          _manufacturer,
        uint256          _quantity,
        string  calldata _note
    )
        external
        onlyApprovedRole(IRegistry.Role.Distributor)
    {
        require(product.batchExistsCheck(_batchNumber),        "Transfer: batch not found");
        require(!product.isBatchValid(_batchNumber),            "Transfer: batch is still valid");
        require(mfrToDistributor[_manufacturer][msg.sender],    "Transfer: not linked to manufacturer");
        require(_quantity > 0,                                  "Transfer: zero quantity");
        require(
            product.getStockOf(_batchNumber, msg.sender) >= _quantity,
            "Transfer: insufficient expired stock"
        );

        product.adjustStock(_batchNumber, msg.sender, _manufacturer, _quantity);

        if (traceSet) {
            trace.recordEvent(
                _batchNumber, msg.sender,
                "ExpiredReturnDistributorToManufacturer", _quantity, _note
            );
        }

        _recordCustodyEntry(_batchNumber, _manufacturer, "ExpiredReturn-Manufacturer");
        emit OwnershipUpdated(_batchNumber, msg.sender, _manufacturer, block.timestamp);
    }

    // ═════════════════════════════════════════════════════════════
    // SECTION 6 — VIEW FUNCTIONS
    // ═════════════════════════════════════════════════════════════

    // ── Whitelist Queries ────────────────────────────────────────

    function getDistributors(address _manufacturer)
        external view returns (address[] memory)
    { return mfrDistributorList[_manufacturer]; }

    function getSuppliers(address _distributor)
        external view returns (address[] memory)
    { return distSupplierList[_distributor]; }

    function getPharmacists(address _supplier)
        external view returns (address[] memory)
    { return suppPharmacistList[_supplier]; }

    function isDistributorOf(address _manufacturer, address _distributor)
        external view returns (bool)
    { return mfrToDistributor[_manufacturer][_distributor]; }

    function isSupplierOf(address _distributor, address _supplier)
        external view returns (bool)
    { return distToSupplier[_distributor][_supplier]; }

    function isPharmacistOf(address _supplier, address _pharmacist)
        external view returns (bool)
    { return suppToPharmacist[_supplier][_pharmacist]; }

    // ── Transfer Request Queries ─────────────────────────────────

    function getTransfer(uint256 _id)
        external view
        transferExists(_id)
        returns (TransferRequest memory)
    { return transfers[_id]; }

    function getSentTransfers(address _sender)
        external view returns (uint256[] memory)
    { return senderTransfers[_sender]; }

    function getReceivedTransfers(address _receiver)
        external view returns (uint256[] memory)
    { return receiverTransfers[_receiver]; }

    function getBatchTransfers(string calldata _batchNumber)
        external view returns (uint256[] memory)
    { return batchTransfers[_batchNumber]; }

    /// @notice Returns all Pending transfer requests sent to the caller.
    ///         Used by Distributor / Supplier / Pharmacist inbox.
    function getMyPendingInbox() external view returns (TransferRequest[] memory) {
        uint256[] storage ids  = receiverTransfers[msg.sender];
        uint256 count = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (transfers[ids[i]].status == TransferStatus.Pending) count++;
        }
        TransferRequest[] memory result = new TransferRequest[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (transfers[ids[i]].status == TransferStatus.Pending) {
                result[idx] = transfers[ids[i]];
                idx++;
            }
        }
        return result;
    }

    /// @notice Returns all Pending transfer requests raised by the caller.
    ///         Used by Manufacturer / Distributor / Supplier outbox.
    function getMyPendingOutbox() external view returns (TransferRequest[] memory) {
        uint256[] storage ids  = senderTransfers[msg.sender];
        uint256 count = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (transfers[ids[i]].status == TransferStatus.Pending) count++;
        }
        TransferRequest[] memory result = new TransferRequest[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < ids.length; i++) {
            if (transfers[ids[i]].status == TransferStatus.Pending) {
                result[idx] = transfers[ids[i]];
                idx++;
            }
        }
        return result;
    }

    // ── Ownership / Custody Queries ──────────────────────────────

    function getCurrentOwner(string calldata _batchNumber)
        external view returns (address)
    { return currentOwner[_batchNumber]; }

    function getCustodyChain(string calldata _batchNumber)
        external view returns (CustodyEntry[] memory)
    { return custodyChain[_batchNumber]; }

    // ── Sale Queries ─────────────────────────────────────────────

    function getSale(uint256 _saleId)
        external view returns (SaleRecord memory)
    {
        require(sales[_saleId].soldAt != 0, "Transfer: sale not found");
        return sales[_saleId];
    }

    function getSalesByPharmacist(address _pharmacist)
        external view returns (uint256[] memory)
    { return pharmacistSales[_pharmacist]; }

    function getSalesByBatch(string calldata _batchNumber)
        external view returns (uint256[] memory)
    { return batchSales[_batchNumber]; }

    /// @notice Returns total units sold from a batch across all pharmacists.
    function getTotalSoldForBatch(string calldata _batchNumber)
        external view returns (uint256 total)
    {
        uint256[] storage ids = batchSales[_batchNumber];
        for (uint256 i = 0; i < ids.length; i++) {
            total += sales[ids[i]].quantity;
        }
    }

    // ── Verification Helpers (used by TraceContract & Buyer page) ─

    /// @notice Returns the transfer hash for a completed transfer.
    ///         Buyer can use this to verify a receipt.
    function getTransferHash(uint256 _transferId)
        external view
        transferExists(_transferId)
        returns (bytes32)
    { return transfers[_transferId].transferHash; }

    /// @notice Returns number of completed (Accepted) transfers for a batch.
    function getAcceptedTransferCount(string calldata _batchNumber)
        external view returns (uint256 count)
    {
        uint256[] storage ids = batchTransfers[_batchNumber];
        for (uint256 i = 0; i < ids.length; i++) {
            if (transfers[ids[i]].status == TransferStatus.Accepted) count++;
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────────────────────

    function _createTransferRequest(
        TransferDirection _direction,
        string  calldata  _batchNumber,
        address           _sender,
        address           _receiver,
        uint256           _quantity,
        uint256           _pricePerUnit,
        string  calldata  _currency,
        string  calldata  _note
    )
        internal
        returns (uint256 id)
    {
        id = nextTransferId;

        TransferRequest storage req = transfers[id];
        req.id           = id;
        req.direction    = _direction;
        req.status       = TransferStatus.Pending;
        req.batchNumber  = _batchNumber;
        req.sender       = _sender;
        req.receiver     = _receiver;
        req.quantity     = _quantity;
        req.pricePerUnit = _pricePerUnit;
        req.currency     = _currency;
        req.note         = _note;
        req.createdAt    = block.timestamp;
        req.resolvedAt   = 0;
        req.transferHash = bytes32(0);

        senderTransfers[_sender].push(id);
        receiverTransfers[_receiver].push(id);
        batchTransfers[_batchNumber].push(id);

        emit TransferRequested(id, _direction, _batchNumber, _sender, _receiver, _quantity, block.timestamp);

        nextTransferId++;
    }

    function _executeTransfer(
        string  calldata  _batchNumber,
        address           _from,
        address           _to,
        uint256           _quantity,
        TransferDirection _direction,
        string  calldata  _note
    )
        internal
    {
        product.adjustStock(_batchNumber, _from, _to, _quantity);

        address previousOwner = currentOwner[_batchNumber];
        currentOwner[_batchNumber] = _to;

        custodyChain[_batchNumber].push(CustodyEntry({
            holder:    _to,
            timestamp: block.timestamp,
            action:    _directionLabel(_direction)
        }));

        if (traceSet) {
            trace.recordEvent(_batchNumber, _to, _directionLabel(_direction), _quantity, _note);
        }

        emit OwnershipUpdated(_batchNumber, previousOwner, _to, block.timestamp);
    }

    function _recordCustodyEntry(
        string memory _batchNumber,
        address       _holder,
        string memory _action
    ) internal {
        custodyChain[_batchNumber].push(CustodyEntry({
            holder:    _holder,
            timestamp: block.timestamp,
            action:    _action
        }));
    }

    function _directionLabel(TransferDirection _d)
        internal pure returns (string memory)
    {
        if (_d == TransferDirection.ManufacturerToDistributor) return "ManufacturerToDistributor";
        if (_d == TransferDirection.DistributorToSupplier)     return "DistributorToSupplier";
        if (_d == TransferDirection.SupplierToPharmacist)      return "SupplierToPharmacist";
        return "PharmacistToBuyer";
    }

    function _removeFromList(address[] storage _list, address _addr) internal {
        uint256 len = _list.length;
        for (uint256 i = 0; i < len; i++) {
            if (_list[i] == _addr) {
                _list[i] = _list[len - 1];
                _list.pop();
                break;
            }
        }
    }
}
