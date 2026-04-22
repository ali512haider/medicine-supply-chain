// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ─────────────────────────────────────────────────────────────────────────────
// Interface — RegistryContract
// ─────────────────────────────────────────────────────────────────────────────

interface IRegistry {
    enum Role {
        None,
        Admin,
        Manufacturer,
        Distributor,
        Supplier,
        Pharmacist
    }

    function isApprovedWithRole(address _addr, IRegistry.Role _role)
        external view returns (bool);

    function isApproved(address _addr) external view returns (bool);
    function getRole(address _addr)    external view returns (IRegistry.Role);
    function admin()                   external view returns (address);
}

// ─────────────────────────────────────────────────────────────────────────────
// ProductContract
// ─────────────────────────────────────────────────────────────────────────────

/// @title  ProductContract
/// @notice Manages medicine batch creation, raw-material records, QR metadata,
///         stock levels, expiry tracking, and recall management for the
///         Blockchain-Based Medicine Supply Chain system.
/// @dev    Manufacturers add batches here.  TransferContract calls
///         adjustStock() whenever ownership moves down the chain.
///         All role checks are delegated to RegistryContract.
contract ProductContract {

    // ─────────────────────────────────────────────────────────────
    // Registry reference
    // ─────────────────────────────────────────────────────────────

    IRegistry public immutable registry;

    // ─────────────────────────────────────────────────────────────
    // Enums
    // ─────────────────────────────────────────────────────────────

    /// @dev Lifecycle states of a medicine batch.
    enum BatchStatus {
        Active,     // 0 – in circulation, valid
        Expired,    // 1 – past expiry date
        Recalled,   // 2 – recalled by manufacturer or admin
        Depleted    // 3 – all units consumed / transferred out
    }

    // ─────────────────────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────────────────────

    struct RawMaterial {
        string name;
        uint256 quantity;   // in grams / ml / units (manufacturer decides unit)
        string  unit;       // "g", "ml", "kg", "units", etc.
    }

    /// @dev Per-node stock entry.  One record exists per (batchNo, holderAddress).
    struct StockEntry {
        address holder;             // who currently holds this portion
        uint256 quantity;           // units held
        uint256 receivedAt;         // timestamp when this holder received stock
        bool    exists;
    }

    struct Batch {
        // ── Identity ────────────────────────────────────────────
        string      batchNumber;
        string      productName;
        string      genericName;        // INN / generic medicine name
        string      dosageForm;         // tablet / syrup / injection / capsule …
        string      strength;           // "500mg", "250mg/5ml" …
        string      manufacturer;       // name string (complementary to address)
        address     manufacturerAddr;

        // ── Raw materials ────────────────────────────────────────
        RawMaterial[] rawMaterials;

        // ── Financial ────────────────────────────────────────────
        uint256     costPerUnit;        // in wei (or a stable unit — your choice)
        string      currency;           // "PKR", "USD" — informational only

        // ── Dates (unix timestamps) ───────────────────────────────
        uint256     mfgDate;
        uint256     expiryDate;
        uint256     createdAt;          // block.timestamp of addBatch()

        // ── Quantities ───────────────────────────────────────────
        uint256     totalQuantity;      // produced
        uint256     remainingAtSource;  // still at manufacturer
        uint256     transferredOut;     // total units moved downstream

        // ── QR / IPFS ────────────────────────────────────────────
        string      qrCodeCID;          // IPFS CID of the QR image
        string      metadataCID;        // IPFS CID of full batch metadata JSON

        // ── Status ───────────────────────────────────────────────
        BatchStatus status;
        string      recallReason;       // non-empty only when status == Recalled

        bool        exists;
    }

    // ─────────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────────

    /// @dev Primary store: batchNumber → Batch
    mapping(string => Batch) private batches;

    /// @dev All batch numbers ever created (for iteration)
    string[] private allBatchNumbers;

    /// @dev Per-manufacturer batch index: address → batchNumbers[]
    mapping(address => string[]) private manufacturerBatches;

    /// @dev Per-node stock: batchNumber → holderAddress → StockEntry
    ///      Updated by both this contract and TransferContract.
    mapping(string => mapping(address => StockEntry)) private nodeStock;

    /// @dev All holders who have ever held a batch (for expiry sweeps)
    mapping(string => address[]) private batchHolders;

    /// @dev Authorised callers (TransferContract address once deployed)
    mapping(address => bool) private authorisedCallers;

    // ─────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────

    event BatchAdded(
        string  indexed batchNumber,
        address indexed manufacturerAddr,
        string          productName,
        uint256         totalQuantity,
        uint256         expiryDate,
        uint256         timestamp
    );

    event BatchStatusChanged(
        string  indexed batchNumber,
        BatchStatus     oldStatus,
        BatchStatus     newStatus,
        address indexed changedBy,
        string          reason,
        uint256         timestamp
    );

    event QRUpdated(
        string  indexed batchNumber,
        string          qrCodeCID,
        string          metadataCID,
        uint256         timestamp
    );

    event StockAdjusted(
        string  indexed batchNumber,
        address indexed holder,
        uint256         previousQty,
        uint256         newQty,
        string          reason,
        uint256         timestamp
    );

    event AuthorisedCallerSet(
        address indexed caller,
        bool            authorised
    );

    event BatchDetailsUpdated(
        string  indexed batchNumber,
        address indexed updatedBy,
        uint256         timestamp
    );

    // ─────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        require(
            msg.sender == registry.admin(),
            "Product: caller is not admin"
        );
        _;
    }

    modifier onlyManufacturer() {
        require(
            registry.isApprovedWithRole(msg.sender, IRegistry.Role.Manufacturer),
            "Product: caller is not an approved manufacturer"
        );
        _;
    }

    modifier onlyAuthorisedCaller() {
        require(
            authorisedCallers[msg.sender] || msg.sender == registry.admin(),
            "Product: caller is not authorised"
        );
        _;
    }

    modifier batchExists(string calldata _batchNo) {
        require(batches[_batchNo].exists, "Product: batch does not exist");
        _;
    }

    modifier batchOwnedByManufacturer(string calldata _batchNo) {
        require(
            batches[_batchNo].manufacturerAddr == msg.sender,
            "Product: caller did not manufacture this batch"
        );
        _;
    }

    // ─────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────

    constructor(address _registryAddress) {
        require(_registryAddress != address(0), "Product: zero registry address");
        registry = IRegistry(_registryAddress);
    }

    // ─────────────────────────────────────────────────────────────
    // Authorised-Caller Management  (Admin only)
    // ─────────────────────────────────────────────────────────────

    /// @notice Grant or revoke permission for a contract (e.g. TransferContract)
    ///         to call adjustStock() and other restricted functions.
    function setAuthorisedCaller(address _caller, bool _authorised)
        external
        onlyAdmin
    {
        require(_caller != address(0), "Product: zero address");
        authorisedCallers[_caller] = _authorised;
        emit AuthorisedCallerSet(_caller, _authorised);
    }

    // ─────────────────────────────────────────────────────────────
    // Batch Creation  (Manufacturer)
    // ─────────────────────────────────────────────────────────────

    /// @notice Add a new medicine batch to the blockchain.
    /// @param _batchNumber   Unique batch identifier (e.g. "MFR-2024-B001").
    /// @param _productName   Brand / trade name.
    /// @param _genericName   INN generic name.
    /// @param _dosageForm    "Tablet", "Syrup", "Injection", etc.
    /// @param _strength      "500mg", "250mg/5ml", etc.
    /// @param _manufacturerName  Legal name of the manufacturing company.
    /// @param _rmNames       Raw material names array.
    /// @param _rmQuantities  Raw material quantities array (parallel to names).
    /// @param _rmUnits       Raw material units array (parallel to names).
    /// @param _costPerUnit   Cost per medicine unit (in smallest currency unit).
    /// @param _currency      Currency string: "PKR", "USD", etc.
    /// @param _mfgDate       Manufacturing date as unix timestamp.
    /// @param _expiryDate    Expiry date as unix timestamp.
    /// @param _totalQuantity Total units produced in this batch.
    /// @param _qrCodeCID     IPFS CID of the QR code image (can be set later).
    /// @param _metadataCID   IPFS CID of full batch metadata JSON (can be set later).
    function addBatch(
        string   calldata _batchNumber,
        string   calldata _productName,
        string   calldata _genericName,
        string   calldata _dosageForm,
        string   calldata _strength,
        string   calldata _manufacturerName,
        string[] calldata _rmNames,
        uint256[] calldata _rmQuantities,
        string[] calldata _rmUnits,
        uint256  _costPerUnit,
        string   calldata _currency,
        uint256  _mfgDate,
        uint256  _expiryDate,
        uint256  _totalQuantity,
        string   calldata _qrCodeCID,
        string   calldata _metadataCID
    )
        external
        onlyManufacturer
    {
        // ── Validations ──────────────────────────────────────────
        require(bytes(_batchNumber).length > 0,   "Product: empty batch number");
        require(!batches[_batchNumber].exists,     "Product: batch number already exists");
        require(bytes(_productName).length > 0,   "Product: empty product name");
        require(_totalQuantity > 0,               "Product: zero quantity");
        require(_mfgDate > 0,                     "Product: invalid mfg date");
        require(_expiryDate > _mfgDate,           "Product: expiry must be after mfg date");
        require(_expiryDate > block.timestamp,    "Product: expiry date already passed");
        require(
            _rmNames.length == _rmQuantities.length &&
            _rmNames.length == _rmUnits.length,
            "Product: raw material arrays length mismatch"
        );

        // ── Build raw materials array ────────────────────────────
        Batch storage b = batches[_batchNumber];
        for (uint256 i = 0; i < _rmNames.length; i++) {
            require(bytes(_rmNames[i]).length > 0,  "Product: empty raw material name");
            require(_rmQuantities[i] > 0,           "Product: zero raw material quantity");
            b.rawMaterials.push(RawMaterial({
                name:     _rmNames[i],
                quantity: _rmQuantities[i],
                unit:     _rmUnits[i]
            }));
        }

        // ── Populate batch ───────────────────────────────────────
        b.batchNumber       = _batchNumber;
        b.productName       = _productName;
        b.genericName       = _genericName;
        b.dosageForm        = _dosageForm;
        b.strength          = _strength;
        b.manufacturer      = _manufacturerName;
        b.manufacturerAddr  = msg.sender;
        b.costPerUnit       = _costPerUnit;
        b.currency          = _currency;
        b.mfgDate           = _mfgDate;
        b.expiryDate        = _expiryDate;
        b.createdAt         = block.timestamp;
        b.totalQuantity     = _totalQuantity;
        b.remainingAtSource = _totalQuantity;
        b.transferredOut    = 0;
        b.qrCodeCID         = _qrCodeCID;
        b.metadataCID       = _metadataCID;
        b.status            = BatchStatus.Active;
        b.recallReason      = "";
        b.exists            = true;

        // ── Update indexes ───────────────────────────────────────
        allBatchNumbers.push(_batchNumber);
        manufacturerBatches[msg.sender].push(_batchNumber);

        // ── Initialise manufacturer's own stock entry ────────────
        nodeStock[_batchNumber][msg.sender] = StockEntry({
            holder:     msg.sender,
            quantity:   _totalQuantity,
            receivedAt: block.timestamp,
            exists:     true
        });
        batchHolders[_batchNumber].push(msg.sender);

        emit BatchAdded(
            _batchNumber,
            msg.sender,
            _productName,
            _totalQuantity,
            _expiryDate,
            block.timestamp
        );
    }

    // ─────────────────────────────────────────────────────────────
    // QR / Metadata Update  (Manufacturer who owns batch)
    // ─────────────────────────────────────────────────────────────

    /// @notice Update or add QR code and metadata IPFS CIDs after batch creation.
    ///         Useful when the QR is generated off-chain right after batch is mined.
    function updateQR(
        string calldata _batchNumber,
        string calldata _qrCodeCID,
        string calldata _metadataCID
    )
        external
        batchExists(_batchNumber)
        batchOwnedByManufacturer(_batchNumber)
    {
        require(bytes(_qrCodeCID).length > 0, "Product: empty QR CID");

        Batch storage b = batches[_batchNumber];
        b.qrCodeCID   = _qrCodeCID;
        b.metadataCID = _metadataCID;

        emit QRUpdated(_batchNumber, _qrCodeCID, _metadataCID, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────
    // Batch Detail Update  (Manufacturer who owns batch)
    // ─────────────────────────────────────────────────────────────

    /// @notice Correct non-critical batch fields (dosage form, strength, CIDs).
    ///         Core identity fields (batchNumber, mfgDate, expiryDate, quantity)
    ///         are intentionally immutable after creation.
    function updateBatchDetails(
        string calldata _batchNumber,
        string calldata _genericName,
        string calldata _dosageForm,
        string calldata _strength,
        uint256         _costPerUnit,
        string calldata _currency
    )
        external
        batchExists(_batchNumber)
        batchOwnedByManufacturer(_batchNumber)
    {
        Batch storage b = batches[_batchNumber];
        require(
            b.status == BatchStatus.Active,
            "Product: can only update Active batches"
        );

        b.genericName = _genericName;
        b.dosageForm  = _dosageForm;
        b.strength    = _strength;
        b.costPerUnit = _costPerUnit;
        b.currency    = _currency;

        emit BatchDetailsUpdated(_batchNumber, msg.sender, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────
    // Status Management
    // ─────────────────────────────────────────────────────────────

    /// @notice Mark a batch as Recalled. Callable by the manufacturer who
    ///         created it, or by admin.
    function recallBatch(string calldata _batchNumber, string calldata _reason)
        external
        batchExists(_batchNumber)
    {
        Batch storage b = batches[_batchNumber];

        bool isAdmin        = (msg.sender == registry.admin());
        bool isManufacturer = (b.manufacturerAddr == msg.sender &&
            registry.isApprovedWithRole(msg.sender, IRegistry.Role.Manufacturer));

        require(isAdmin || isManufacturer, "Product: not authorised to recall");
        require(b.status == BatchStatus.Active, "Product: batch is not Active");
        require(bytes(_reason).length > 0,      "Product: recall reason required");

        BatchStatus old = b.status;
        b.status       = BatchStatus.Recalled;
        b.recallReason = _reason;

        emit BatchStatusChanged(
            _batchNumber, old, BatchStatus.Recalled,
            msg.sender, _reason, block.timestamp
        );
    }

    /// @notice Expire a single batch by batch number.
    ///         Callable by admin, or by any approved entity checking their own stock.
    function expireBatch(string calldata _batchNumber)
        external
        batchExists(_batchNumber)
    {
        Batch storage b = batches[_batchNumber];

        require(b.status == BatchStatus.Active,  "Product: batch is not Active");
        require(
            block.timestamp >= b.expiryDate,
            "Product: batch has not expired yet"
        );

        BatchStatus old = b.status;
        b.status = BatchStatus.Expired;

        emit BatchStatusChanged(
            _batchNumber, old, BatchStatus.Expired,
            msg.sender, "Expiry date reached", block.timestamp
        );
    }

    /// @notice Bulk-expire all batches whose expiryDate has passed.
    ///         Anyone can call this (gas incentive can be added by the project).
    function expireAllOverdueBatches() external {
        for (uint256 i = 0; i < allBatchNumbers.length; i++) {
            Batch storage b = batches[allBatchNumbers[i]];
            if (
                b.status == BatchStatus.Active &&
                block.timestamp >= b.expiryDate
            ) {
                BatchStatus old = b.status;
                b.status = BatchStatus.Expired;
                emit BatchStatusChanged(
                    b.batchNumber, old, BatchStatus.Expired,
                    msg.sender, "Auto-expired", block.timestamp
                );
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Stock Adjustment  (Called by TransferContract)
    // ─────────────────────────────────────────────────────────────

    /// @notice Deduct stock from a sender and credit it to a receiver.
    ///         Called exclusively by TransferContract when ownership moves.
    /// @param _batchNumber  The batch being transferred.
    /// @param _from         Current holder losing stock.
    /// @param _to           Next holder gaining stock.
    /// @param _quantity     Number of units moving.
    function adjustStock(
        string  calldata _batchNumber,
        address _from,
        address _to,
        uint256 _quantity
    )
        external
        onlyAuthorisedCaller
        batchExists(_batchNumber)
    {
        require(_quantity > 0,           "Product: zero quantity");
        require(_from != address(0),     "Product: zero from address");
        require(_to   != address(0),     "Product: zero to address");
        require(_from != _to,            "Product: from and to are the same");

        Batch storage b = batches[_batchNumber];
        require(
            b.status == BatchStatus.Active,
            "Product: batch is not Active"
        );

        // ── Deduct from sender ───────────────────────────────────
        StockEntry storage fromEntry = nodeStock[_batchNumber][_from];
        require(fromEntry.exists,                  "Product: sender has no stock record");
        require(fromEntry.quantity >= _quantity,   "Product: insufficient stock at sender");

        uint256 prevFrom = fromEntry.quantity;
        fromEntry.quantity -= _quantity;

        emit StockAdjusted(
            _batchNumber, _from,
            prevFrom, fromEntry.quantity,
            "transfer-out", block.timestamp
        );

        // ── Credit to receiver ───────────────────────────────────
        StockEntry storage toEntry = nodeStock[_batchNumber][_to];
        uint256 prevTo = toEntry.exists ? toEntry.quantity : 0;

        if (!toEntry.exists) {
            nodeStock[_batchNumber][_to] = StockEntry({
                holder:     _to,
                quantity:   _quantity,
                receivedAt: block.timestamp,
                exists:     true
            });
            batchHolders[_batchNumber].push(_to);
        } else {
            toEntry.quantity += _quantity;
        }

        emit StockAdjusted(
            _batchNumber, _to,
            prevTo, prevTo + _quantity,
            "transfer-in", block.timestamp
        );

        // ── Update batch-level counters ──────────────────────────
        if (_from == b.manufacturerAddr) {
            // Stock leaving the manufacturer's own hands
            b.remainingAtSource -= _quantity;
            b.transferredOut    += _quantity;
        }

        // ── Auto-deplete if all manufacturer stock is gone ───────
        if (b.remainingAtSource == 0 && b.transferredOut == b.totalQuantity) {
            BatchStatus old = b.status;
            b.status = BatchStatus.Depleted;
            emit BatchStatusChanged(
                _batchNumber, old, BatchStatus.Depleted,
                msg.sender, "All stock transferred", block.timestamp
            );
        }
    }

    /// @notice Pharmacist sells to a buyer (reduces pharmacist's stock).
    ///         Called by TransferContract when a sale is recorded.
    function deductSale(
        string  calldata _batchNumber,
        address _pharmacist,
        uint256 _quantity
    )
        external
        onlyAuthorisedCaller
        batchExists(_batchNumber)
    {
        require(_quantity > 0, "Product: zero quantity");

        StockEntry storage entry = nodeStock[_batchNumber][_pharmacist];
        require(entry.exists,                  "Product: pharmacist has no stock");
        require(entry.quantity >= _quantity,   "Product: insufficient pharmacist stock");

        uint256 prev = entry.quantity;
        entry.quantity -= _quantity;

        emit StockAdjusted(
            _batchNumber, _pharmacist,
            prev, entry.quantity,
            "sale", block.timestamp
        );
    }

    // ─────────────────────────────────────────────────────────────
    // View — Batch Data
    // ─────────────────────────────────────────────────────────────

    /// @notice Returns the full Batch struct for a given batch number.
    ///         Note: rawMaterials array is NOT returned here (use getRawMaterials).
    function getBatch(string calldata _batchNumber)
        external
        view
        batchExists(_batchNumber)
        returns (
            string  memory batchNumber,
            string  memory productName,
            string  memory genericName,
            string  memory dosageForm,
            string  memory strength,
            string  memory manufacturer,
            address        manufacturerAddr,
            uint256        costPerUnit,
            string  memory currency,
            uint256        mfgDate,
            uint256        expiryDate,
            uint256        createdAt,
            uint256        totalQuantity,
            uint256        remainingAtSource,
            uint256        transferredOut,
            string  memory qrCodeCID,
            string  memory metadataCID,
            BatchStatus    status,
            string  memory recallReason
        )
    {
        Batch storage b = batches[_batchNumber];
        return (
            b.batchNumber,
            b.productName,
            b.genericName,
            b.dosageForm,
            b.strength,
            b.manufacturer,
            b.manufacturerAddr,
            b.costPerUnit,
            b.currency,
            b.mfgDate,
            b.expiryDate,
            b.createdAt,
            b.totalQuantity,
            b.remainingAtSource,
            b.transferredOut,
            b.qrCodeCID,
            b.metadataCID,
            b.status,
            b.recallReason
        );
    }

    /// @notice Returns the raw materials list for a batch.
    function getRawMaterials(string calldata _batchNumber)
        external
        view
        batchExists(_batchNumber)
        returns (RawMaterial[] memory)
    {
        return batches[_batchNumber].rawMaterials;
    }

    /// @notice Returns QR and metadata CIDs (for the buyer verification page).
    function getQRData(string calldata _batchNumber)
        external
        view
        batchExists(_batchNumber)
        returns (string memory qrCodeCID, string memory metadataCID)
    {
        Batch storage b = batches[_batchNumber];
        return (b.qrCodeCID, b.metadataCID);
    }

    /// @notice Check whether a batch is still valid (Active and not expired).
    function isBatchValid(string calldata _batchNumber)
        external
        view
        returns (bool)
    {
        if (!batches[_batchNumber].exists) return false;
        Batch storage b = batches[_batchNumber];
        return b.status == BatchStatus.Active &&
               block.timestamp < b.expiryDate;
    }

    /// @notice Returns the current on-chain status of a batch.
    ///         If the expiry date has passed, returns Expired even if
    ///         the status hasn't been written yet (lazy check).
    function getBatchStatus(string calldata _batchNumber)
        external
        view
        batchExists(_batchNumber)
        returns (BatchStatus)
    {
        Batch storage b = batches[_batchNumber];
        if (b.status == BatchStatus.Active && block.timestamp >= b.expiryDate) {
            return BatchStatus.Expired;
        }
        return b.status;
    }

    // ─────────────────────────────────────────────────────────────
    // View — Stock Queries
    // ─────────────────────────────────────────────────────────────

    /// @notice Returns the stock quantity of a specific batch held by a specific address.
    function getStockOf(string calldata _batchNumber, address _holder)
        external
        view
        returns (uint256)
    {
        return nodeStock[_batchNumber][_holder].quantity;
    }

    /// @notice Returns the full StockEntry for a holder.
    function getStockEntry(string calldata _batchNumber, address _holder)
        external
        view
        returns (StockEntry memory)
    {
        return nodeStock[_batchNumber][_holder];
    }

    /// @notice Returns all addresses that have ever held a batch.
    function getBatchHolders(string calldata _batchNumber)
        external
        view
        batchExists(_batchNumber)
        returns (address[] memory)
    {
        return batchHolders[_batchNumber];
    }

    // ─────────────────────────────────────────────────────────────
    // View — Batch Lists
    // ─────────────────────────────────────────────────────────────

    /// @notice Returns all batch numbers ever created.
    function getAllBatchNumbers() external view returns (string[] memory) {
        return allBatchNumbers;
    }

    /// @notice Returns all batches created by a specific manufacturer.
    function getBatchesByManufacturer(address _manufacturer)
        external
        view
        returns (string[] memory)
    {
        return manufacturerBatches[_manufacturer];
    }

    /// @notice Returns batch numbers where a specific address still has
    ///         non-zero stock — used to show "available stock" dashboards.
    function getAvailableStockBatches(address _holder)
        external
        view
        returns (string[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < allBatchNumbers.length; i++) {
            if (nodeStock[allBatchNumbers[i]][_holder].quantity > 0) count++;
        }

        string[] memory result = new string[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allBatchNumbers.length; i++) {
            if (nodeStock[allBatchNumbers[i]][_holder].quantity > 0) {
                result[idx] = allBatchNumbers[i];
                idx++;
            }
        }
        return result;
    }

    /// @notice Returns batch numbers that are expired AND where the
    ///         holder still has non-zero stock (for return/recall workflows).
    function getExpiredStockBatches(address _holder)
        external
        view
        returns (string[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < allBatchNumbers.length; i++) {
            string storage bn = allBatchNumbers[i];
            Batch  storage b  = batches[bn];
            bool   expired    = b.status == BatchStatus.Expired ||
                                (b.status == BatchStatus.Active && block.timestamp >= b.expiryDate);
            if (expired && nodeStock[bn][_holder].quantity > 0) count++;
        }

        string[] memory result = new string[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allBatchNumbers.length; i++) {
            string storage bn = allBatchNumbers[i];
            Batch  storage b  = batches[bn];
            bool   expired    = b.status == BatchStatus.Expired ||
                                (b.status == BatchStatus.Active && block.timestamp >= b.expiryDate);
            if (expired && nodeStock[bn][_holder].quantity > 0) {
                result[idx] = bn;
                idx++;
            }
        }
        return result;
    }

    /// @notice Returns all Active (non-expired, non-recalled) batches
    ///         that still have stock remaining at the manufacturer source.
    ///         Used by Distributor to see what is available to request.
    function getActiveBatchesAtManufacturer(address _manufacturer)
        external
        view
        returns (string[] memory)
    {
        string[] storage mBatches = manufacturerBatches[_manufacturer];
        uint256 count = 0;

        for (uint256 i = 0; i < mBatches.length; i++) {
            Batch storage b = batches[mBatches[i]];
            if (
                b.status == BatchStatus.Active &&
                block.timestamp < b.expiryDate &&
                b.remainingAtSource > 0
            ) count++;
        }

        string[] memory result = new string[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < mBatches.length; i++) {
            Batch storage b = batches[mBatches[i]];
            if (
                b.status == BatchStatus.Active &&
                block.timestamp < b.expiryDate &&
                b.remainingAtSource > 0
            ) {
                result[idx] = mBatches[i];
                idx++;
            }
        }
        return result;
    }

    /// @notice Returns all Recalled batches (system-wide). Admin use.
    function getRecalledBatches() external view returns (string[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < allBatchNumbers.length; i++) {
            if (batches[allBatchNumbers[i]].status == BatchStatus.Recalled) count++;
        }
        string[] memory result = new string[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allBatchNumbers.length; i++) {
            if (batches[allBatchNumbers[i]].status == BatchStatus.Recalled) {
                result[idx] = allBatchNumbers[i];
                idx++;
            }
        }
        return result;
    }

    // ─────────────────────────────────────────────────────────────
    // View — Quick Lookups (Buyer / QR scan)
    // ─────────────────────────────────────────────────────────────

    /// @notice Returns minimal info needed by a Buyer to verify a medicine.
    function verifyBatch(string calldata _batchNumber)
        external
        view
        returns (
            bool    exists_,
            string  memory productName,
            string  memory genericName,
            string  memory manufacturer,
            uint256        mfgDate,
            uint256        expiryDate,
            BatchStatus    status,
            bool    isExpired,
            bool    isRecalled,
            string  memory qrCodeCID
        )
    {
        if (!batches[_batchNumber].exists) {
            return (false, "", "", "", 0, 0, BatchStatus.Active, false, false, "");
        }
        Batch storage b = batches[_batchNumber];
        return (
            true,
            b.productName,
            b.genericName,
            b.manufacturer,
            b.mfgDate,
            b.expiryDate,
            b.status,
            block.timestamp >= b.expiryDate,
            b.status == BatchStatus.Recalled,
            b.qrCodeCID
        );
    }

    /// @notice Simple existence check used by TraceContract.
    function batchExistsCheck(string calldata _batchNumber)
        external
        view
        returns (bool)
    {
        return batches[_batchNumber].exists;
    }
}
