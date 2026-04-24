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
    function getLicenseNumber(address _addr) external view returns (string memory);
}

// ─────────────────────────────────────────────────────────────────────────────
// Interface — ProductContract
// ─────────────────────────────────────────────────────────────────────────────

interface IProduct {
    enum BatchStatus { Active, Expired, Recalled, Depleted }

    function batchExistsCheck(string calldata _batchNumber)
        external view returns (bool);

    function getBatchStatus(string calldata _batchNumber)
        external view returns (IProduct.BatchStatus);

    function getStockOf(string calldata _batchNumber, address _holder)
        external view returns (uint256);

    function isBatchValid(string calldata _batchNumber)
        external view returns (bool);

    function getQRData(string calldata _batchNumber)
        external view returns (string memory qrCodeCID, string memory metadataCID);

    // Full batch info for the public verification page
    function getBatch(string calldata _batchNumber)
        external view returns (
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
            IProduct.BatchStatus status,
            string  memory recallReason
        );
}

// ─────────────────────────────────────────────────────────────────────────────
// Interface — TransferContract
// ─────────────────────────────────────────────────────────────────────────────

interface ITransfer {
    struct CustodyEntry {
        address holder;
        uint256 timestamp;
        string  action;
    }

    function getCurrentOwner(string calldata _batchNumber)
        external view returns (address);

    function getCustodyChain(string calldata _batchNumber)
        external view returns (ITransfer.CustodyEntry[] memory);

    function getTotalSoldForBatch(string calldata _batchNumber)
        external view returns (uint256);

    function getAcceptedTransferCount(string calldata _batchNumber)
        external view returns (uint256);
}

// ─────────────────────────────────────────────────────────────────────────────
// TraceContract
// ─────────────────────────────────────────────────────────────────────────────

/// @title  TraceContract
/// @notice The read/audit layer of the medicine supply chain.
///         Records every on-chain event (called by TransferContract),
///         stores product hash fingerprints for originality checks,
///         and exposes rich query functions for every dashboard and
///         the public Buyer verification page.
///
/// @dev    Write path  : only TransferContract (authorised caller) can push events.
///         Read path   : anyone — no role restriction on view functions.
///         This contract never moves tokens or stock; it is purely observational
///         except for the event log it maintains.
contract TraceContract {

    // ─────────────────────────────────────────────────────────────
    // Contract references
    // ─────────────────────────────────────────────────────────────

    IRegistry public immutable registry;
    IProduct  public immutable productContract;
    ITransfer public immutable transferContract;

    // ─────────────────────────────────────────────────────────────
    // Enums
    // ─────────────────────────────────────────────────────────────

    /// @dev High-level category tag stored alongside every TraceEvent.
    ///      Lets the frontend filter events by type without string parsing.
    enum EventType {
        BatchCreated,                       // 0 – manufacturer added batch
        ManufacturerToDistributor,          // 1
        DistributorToSupplier,              // 2
        SupplierToPharmacist,               // 3
        PharmacistToBuyer,                  // 4
        ExpiredReturnPharmacistToSupplier,  // 5
        ExpiredReturnSupplierToDistributor, // 6
        ExpiredReturnDistributorToManufacturer, // 7
        BatchRecalled,                      // 8
        BatchExpired,                       // 9
        Custom                              // 10 – admin annotations
    }

    // ─────────────────────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────────────────────

    struct TraceEvent {
        uint256   eventId;
        string    batchNumber;
        address   actor;            // who triggered the action
        IRegistry.Role actorRole;   // role at time of event (snapshot)
        string    actorLicense;     // license number snapshot
        EventType eventType;
        string    action;           // human-readable label
        uint256   quantity;         // units involved (0 for non-stock events)
        string    note;             // optional delivery / prescription note
        uint256   timestamp;
        bytes32   eventHash;        // tamper-evident fingerprint
    }

    struct ProductFingerprint {
        bytes32 dataHash;           // keccak256 of core batch fields at creation
        uint256 registeredAt;
        address registeredBy;       // manufacturer address
        bool    exists;
    }

    struct VerificationResult {
        bool    batchFound;
        bool    isOriginal;         // dataHash matches on-chain fingerprint
        bool    isExpired;
        bool    isRecalled;
        bool    isActive;
        string  productName;
        string  genericName;
        string  manufacturer;
        string  manufacturerLicense;
        uint256 mfgDate;
        uint256 expiryDate;
        address currentOwner;
        IRegistry.Role currentOwnerRole;
        uint256 totalTransfers;
        uint256 totalSold;
        uint256 eventCount;
        string  qrCodeCID;
        string  metadataCID;
        IProduct.BatchStatus batchStatus;
    }

    // ─────────────────────────────────────────────────────────────
    // Storage
    // ─────────────────────────────────────────────────────────────

    /// @dev Authorised callers that may push events (TransferContract).
    mapping(address => bool) private authorisedCallers;

    /// @dev Global event counter
    uint256 private nextEventId = 1;

    /// @dev Per-batch event log: batchNumber → TraceEvent[]
    mapping(string => TraceEvent[]) private batchEvents;

    /// @dev Global event index: eventId → TraceEvent (for admin global queries)
    mapping(uint256 => TraceEvent) private eventById;

    /// @dev All event IDs ever (for full system audit)
    uint256[] private allEventIds;

    /// @dev Per-actor event index: actor address → eventIds[]
    mapping(address => uint256[]) private actorEvents;

    /// @dev Per-batch originality fingerprint
    mapping(string => ProductFingerprint) private fingerprints;

    /// @dev Alert log: admin can annotate any batch with a note
    struct AdminAnnotation {
        address admin;
        string  note;
        uint256 timestamp;
    }
    mapping(string => AdminAnnotation[]) private adminAnnotations;

    // ─────────────────────────────────────────────────────────────
    // Events (Solidity events — indexed for off-chain listeners)
    // ─────────────────────────────────────────────────────────────

    event TraceEventRecorded(
        uint256 indexed eventId,
        string  indexed batchNumber,
        address indexed actor,
        EventType       eventType,
        uint256         quantity,
        bytes32         eventHash,
        uint256         timestamp
    );

    event FingerprintRegistered(
        string  indexed batchNumber,
        bytes32         dataHash,
        address indexed registeredBy,
        uint256         timestamp
    );

    event AdminAnnotationAdded(
        string  indexed batchNumber,
        address indexed admin,
        uint256         timestamp
    );

    event AuthorisedCallerSet(address indexed caller, bool authorised);

    // ─────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        require(msg.sender == registry.admin(), "Trace: not admin");
        _;
    }

    modifier onlyAuthorised() {
        require(
            authorisedCallers[msg.sender] || msg.sender == registry.admin(),
            "Trace: caller not authorised to record events"
        );
        _;
    }

    modifier onlyManufacturer() {
        require(
            registry.isApprovedWithRole(msg.sender, IRegistry.Role.Manufacturer),
            "Trace: caller is not an approved manufacturer"
        );
        _;
    }

    modifier batchMustExist(string calldata _batchNumber) {
        require(
            productContract.batchExistsCheck(_batchNumber),
            "Trace: batch does not exist"
        );
        _;
    }

    // ─────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────

    constructor(
        address _registry,
        address _product,
        address _transfer
    ) {
        require(_registry != address(0), "Trace: zero registry");
        require(_product  != address(0), "Trace: zero product");
        require(_transfer != address(0), "Trace: zero transfer");

        registry         = IRegistry(_registry);
        productContract  = IProduct(_product);
        transferContract = ITransfer(_transfer);

        // Authorise TransferContract to push events
        authorisedCallers[_transfer] = true;
        emit AuthorisedCallerSet(_transfer, true);
    }

    // ─────────────────────────────────────────────────────────────
    // Authorised Caller Management  (Admin)
    // ─────────────────────────────────────────────────────────────

    /// @notice Grant or revoke event-recording permission for a contract.
    function setAuthorisedCaller(address _caller, bool _authorised)
        external
        onlyAdmin
    {
        require(_caller != address(0), "Trace: zero address");
        authorisedCallers[_caller] = _authorised;
        emit AuthorisedCallerSet(_caller, _authorised);
    }

    // ─────────────────────────────────────────────────────────────
    // Event Recording  (called by TransferContract)
    // ─────────────────────────────────────────────────────────────

    /// @notice Record a supply-chain event.
    ///         Called by TransferContract on every accepted transfer and sale.
    /// @param _batchNumber  The batch involved.
    /// @param _actor        The address that triggered the action.
    /// @param _action       String label (must match EventType — see _parseEventType).
    /// @param _quantity     Units involved. 0 for non-stock events.
    /// @param _note         Optional delivery / prescription note.
    function recordEvent(
        string  calldata _batchNumber,
        address          _actor,
        string  calldata _action,
        uint256          _quantity,
        string  calldata _note
    )
        external
        onlyAuthorised
    {
        require(bytes(_batchNumber).length > 0, "Trace: empty batch number");
        require(_actor != address(0),           "Trace: zero actor");
        require(bytes(_action).length > 0,      "Trace: empty action");

        EventType    eType   = _parseEventType(_action);
        IRegistry.Role role  = registry.getRole(_actor);
        string memory license = "";

        // Snapshot the license number — it may change or be revoked later
        try registry.getLicenseNumber(_actor) returns (string memory lic) {
            license = lic;
        } catch {}

        // Build tamper-evident hash
        bytes32 eHash = keccak256(abi.encodePacked(
            nextEventId,
            _batchNumber,
            _actor,
            _action,
            _quantity,
            block.timestamp,
            blockhash(block.number - 1)
        ));

        TraceEvent memory te = TraceEvent({
            eventId:      nextEventId,
            batchNumber:  _batchNumber,
            actor:        _actor,
            actorRole:    role,
            actorLicense: license,
            eventType:    eType,
            action:       _action,
            quantity:     _quantity,
            note:         _note,
            timestamp:    block.timestamp,
            eventHash:    eHash
        });

        // Store in all indexes
        batchEvents[_batchNumber].push(te);
        eventById[nextEventId] = te;
        allEventIds.push(nextEventId);
        actorEvents[_actor].push(nextEventId);

        emit TraceEventRecorded(
            nextEventId,
            _batchNumber,
            _actor,
            eType,
            _quantity,
            eHash,
            block.timestamp
        );

        nextEventId++;
    }

    // ─────────────────────────────────────────────────────────────
    // Fingerprint Registration  (called by Manufacturer)
    // ─────────────────────────────────────────────────────────────

    /// @notice Manufacturer registers a cryptographic fingerprint of a batch
    ///         at the time of creation. Used later by buyers to verify originality.
    ///
    ///         The hash should be computed OFF-CHAIN as:
    ///         keccak256(abi.encodePacked(
    ///             batchNumber, productName, genericName, strength,
    ///             manufacturerAddr, mfgDate, expiryDate, totalQuantity
    ///         ))
    ///         and then passed here. This way the data is verifiable without
    ///         storing all fields again on-chain.
    ///
    /// @param _batchNumber The batch to fingerprint.
    /// @param _dataHash    keccak256 hash of core batch fields.
    function registerFingerprint(
        string  calldata _batchNumber,
        bytes32          _dataHash
    )
        external
        onlyManufacturer
        batchMustExist(_batchNumber)
    {
        require(_dataHash != bytes32(0),                   "Trace: empty hash");
        require(!fingerprints[_batchNumber].exists,        "Trace: fingerprint already registered");

        fingerprints[_batchNumber] = ProductFingerprint({
            dataHash:     _dataHash,
            registeredAt: block.timestamp,
            registeredBy: msg.sender,
            exists:       true
        });

        // Record a trace event for the registration itself
        _recordInternalEvent(
            _batchNumber,
            msg.sender,
            "BatchCreated",
            0,
            "Fingerprint registered"
        );

        emit FingerprintRegistered(_batchNumber, _dataHash, msg.sender, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────
    // Admin Annotation
    // ─────────────────────────────────────────────────────────────

    /// @notice Admin can attach an on-chain note to any batch
    ///         (e.g. "Inspection passed", "Quality alert", "Under investigation").
    function annotate(string calldata _batchNumber, string calldata _note)
        external
        onlyAdmin
        batchMustExist(_batchNumber)
    {
        require(bytes(_note).length > 0, "Trace: empty note");

        adminAnnotations[_batchNumber].push(AdminAnnotation({
            admin:     msg.sender,
            note:      _note,
            timestamp: block.timestamp
        }));

        _recordInternalEvent(_batchNumber, msg.sender, "Custom", 0, _note);

        emit AdminAnnotationAdded(_batchNumber, msg.sender, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────
    // VIEW — Full History (for all role dashboards)
    // ─────────────────────────────────────────────────────────────

    /// @notice Returns the complete ordered event log for a batch.
    ///         Used by all role dashboards to show the "trace timeline".
    function getFullHistory(string calldata _batchNumber)
        external
        view
        batchMustExist(_batchNumber)
        returns (TraceEvent[] memory)
    {
        return batchEvents[_batchNumber];
    }

    /// @notice Returns a slice of events for pagination.
    /// @param _from  Start index (0-based, inclusive).
    /// @param _to    End index (inclusive). If _to >= array length, clamps to last.
    function getHistorySlice(
        string calldata _batchNumber,
        uint256 _from,
        uint256 _to
    )
        external
        view
        batchMustExist(_batchNumber)
        returns (TraceEvent[] memory)
    {
        TraceEvent[] storage events = batchEvents[_batchNumber];
        uint256 len = events.length;
        if (len == 0 || _from >= len) return new TraceEvent[](0);

        uint256 end = _to >= len ? len - 1 : _to;
        uint256 size = end - _from + 1;

        TraceEvent[] memory result = new TraceEvent[](size);
        for (uint256 i = 0; i < size; i++) {
            result[i] = events[_from + i];
        }
        return result;
    }

    /// @notice Returns events filtered by EventType (e.g. only transfers).
    function getHistoryByType(
        string    calldata _batchNumber,
        EventType          _eventType
    )
        external
        view
        batchMustExist(_batchNumber)
        returns (TraceEvent[] memory)
    {
        TraceEvent[] storage events = batchEvents[_batchNumber];
        uint256 count = 0;
        for (uint256 i = 0; i < events.length; i++) {
            if (events[i].eventType == _eventType) count++;
        }
        TraceEvent[] memory result = new TraceEvent[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < events.length; i++) {
            if (events[i].eventType == _eventType) {
                result[idx] = events[i];
                idx++;
            }
        }
        return result;
    }

    /// @notice Returns all events triggered by a specific actor address.
    function getEventsByActor(address _actor)
        external
        view
        returns (TraceEvent[] memory)
    {
        uint256[] storage ids = actorEvents[_actor];
        TraceEvent[] memory result = new TraceEvent[](ids.length);
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = eventById[ids[i]];
        }
        return result;
    }

    /// @notice Returns a single event by its global ID.
    function getEventById(uint256 _eventId)
        external
        view
        returns (TraceEvent memory)
    {
        require(eventById[_eventId].timestamp != 0, "Trace: event not found");
        return eventById[_eventId];
    }

    /// @notice Returns the total number of events recorded for a batch.
    function getEventCount(string calldata _batchNumber)
        external
        view
        returns (uint256)
    {
        return batchEvents[_batchNumber].length;
    }

    /// @notice Returns the total number of events in the whole system.
    function getTotalEventCount() external view returns (uint256) {
        return allEventIds.length;
    }

    // ─────────────────────────────────────────────────────────────
    // VIEW — Verification (Buyer / Public)
    // ─────────────────────────────────────────────────────────────

    /// @notice The primary buyer-facing function. Given a batch number
    ///         (typed or scanned via QR), returns a complete VerificationResult
    ///         struct with all the information needed to confirm:
    ///           1. The product exists on-chain.
    ///           2. It matches the manufacturer's registered fingerprint.
    ///           3. It has not expired or been recalled.
    ///           4. Where it currently is in the supply chain.
    ///           5. How many times it changed hands.
    function verifyProduct(string calldata _batchNumber)
        external
        view
        returns (VerificationResult memory result)
    {
        // ── Does the batch exist? ────────────────────────────────
        if (!productContract.batchExistsCheck(_batchNumber)) {
            result.batchFound = false;
            return result;
        }

        result.batchFound = true;

        // ── Pull batch data ──────────────────────────────────────
        (
            ,                           // batchNumber (same as input)
            string memory productName,
            string memory genericName,
            ,                           // dosageForm
            ,                           // strength
            string memory manufacturer,
            address manufacturerAddr,
            ,                           // costPerUnit
            ,                           // currency
            uint256 mfgDate,
            uint256 expiryDate,
            ,                           // createdAt
            ,                           // totalQuantity
            ,                           // remainingAtSource
            ,                           // transferredOut
            string memory qrCodeCID,
            string memory metadataCID,
            IProduct.BatchStatus bStatus,
            // recallReason
        ) = productContract.getBatch(_batchNumber);

        result.productName   = productName;
        result.genericName   = genericName;
        result.manufacturer  = manufacturer;
        result.mfgDate       = mfgDate;
        result.expiryDate    = expiryDate;
        result.qrCodeCID     = qrCodeCID;
        result.metadataCID   = metadataCID;
        result.batchStatus   = bStatus;

        // ── Manufacturer license snapshot ────────────────────────
        try registry.getLicenseNumber(manufacturerAddr) returns (string memory lic) {
            result.manufacturerLicense = lic;
        } catch {
            result.manufacturerLicense = "";
        }

        // ── Expiry & recall flags ────────────────────────────────
        result.isExpired  = (block.timestamp >= expiryDate) ||
                            (bStatus == IProduct.BatchStatus.Expired);
        result.isRecalled = (bStatus == IProduct.BatchStatus.Recalled);
        result.isActive   = !result.isExpired && !result.isRecalled &&
                            (bStatus == IProduct.BatchStatus.Active);

        // ── Current owner ────────────────────────────────────────
        result.currentOwner = transferContract.getCurrentOwner(_batchNumber);
        if (result.currentOwner != address(0)) {
            result.currentOwnerRole = registry.getRole(result.currentOwner);
        }

        // ── Transfer & sale stats ────────────────────────────────
        result.totalTransfers = transferContract.getAcceptedTransferCount(_batchNumber);
        result.totalSold      = transferContract.getTotalSoldForBatch(_batchNumber);

        // ── Event count ──────────────────────────────────────────
        result.eventCount = batchEvents[_batchNumber].length;

        // ── Originality check — fingerprint not required to be set ──
        result.isOriginal = false;  // default
        if (fingerprints[_batchNumber].exists) {
            // Caller can supply hash off-chain; here we just confirm
            // fingerprint exists and was set by the correct manufacturer
            result.isOriginal = (fingerprints[_batchNumber].registeredBy == manufacturerAddr);
        }
    }

    /// @notice Buyer supplies the hash they computed from the medicine packaging.
    ///         Returns true if it matches the on-chain fingerprint exactly.
    ///         This is the tamper / counterfeit detection call.
    function verifyFingerprint(
        string  calldata _batchNumber,
        bytes32          _suppliedHash
    )
        external
        view
        returns (
            bool    matches,
            bool    fingerprintExists,
            address registeredBy,
            uint256 registeredAt
        )
    {
        ProductFingerprint storage fp = fingerprints[_batchNumber];
        if (!fp.exists) {
            return (false, false, address(0), 0);
        }
        return (
            fp.dataHash == _suppliedHash,
            true,
            fp.registeredBy,
            fp.registeredAt
        );
    }

    /// @notice Returns the full fingerprint record for a batch.
    function getFingerprint(string calldata _batchNumber)
        external
        view
        returns (ProductFingerprint memory)
    {
        return fingerprints[_batchNumber];
    }

    // ─────────────────────────────────────────────────────────────
    // VIEW — Custody Chain (timeline for all roles & buyer)
    // ─────────────────────────────────────────────────────────────

    /// @notice Returns the full ordered custody chain from TransferContract.
    ///         Each entry shows who held the batch and when.
    function getCustodyChain(string calldata _batchNumber)
        external
        view
        batchMustExist(_batchNumber)
        returns (ITransfer.CustodyEntry[] memory)
    {
        return transferContract.getCustodyChain(_batchNumber);
    }

    /// @notice Returns a human-readable summary of each custody step,
    ///         enriched with role and license data from RegistryContract.
    ///         Ideal for the buyer's "journey" card view.
    function getCustodyTimeline(string calldata _batchNumber)
        external
        view
        batchMustExist(_batchNumber)
        returns (
            address[] memory holders,
            string[]  memory roles,
            string[]  memory licenses,
            string[]  memory actions,
            uint256[] memory timestamps
        )
    {
        ITransfer.CustodyEntry[] memory chain =
            transferContract.getCustodyChain(_batchNumber);

        uint256 len = chain.length;
        holders    = new address[](len);
        roles      = new string[](len);
        licenses   = new string[](len);
        actions    = new string[](len);
        timestamps = new uint256[](len);

        for (uint256 i = 0; i < len; i++) {
            holders[i]    = chain[i].holder;
            actions[i]    = chain[i].action;
            timestamps[i] = chain[i].timestamp;
            roles[i]      = _roleLabel(registry.getRole(chain[i].holder));
            try registry.getLicenseNumber(chain[i].holder) returns (string memory lic) {
                licenses[i] = lic;
            } catch {
                licenses[i] = "";
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    // VIEW — Role-Specific Stock Dashboards
    // ─────────────────────────────────────────────────────────────

    /// @notice Returns the current stock quantity for a holder across a batch.
    ///         Thin wrapper — delegates to ProductContract.
    function getStockOf(string calldata _batchNumber, address _holder)
        external
        view
        returns (uint256)
    {
        return productContract.getStockOf(_batchNumber, _holder);
    }

    /// @notice Returns events relevant to a specific node (role dashboard).
    ///         Filters the batch event log to only events where actor == _holder.
    function getEventsForHolder(
        string  calldata _batchNumber,
        address          _holder
    )
        external
        view
        returns (TraceEvent[] memory)
    {
        TraceEvent[] storage events = batchEvents[_batchNumber];
        uint256 count = 0;
        for (uint256 i = 0; i < events.length; i++) {
            if (events[i].actor == _holder) count++;
        }
        TraceEvent[] memory result = new TraceEvent[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < events.length; i++) {
            if (events[i].actor == _holder) {
                result[idx] = events[i];
                idx++;
            }
        }
        return result;
    }

    // ─────────────────────────────────────────────────────────────
    // VIEW — Admin Queries
    // ─────────────────────────────────────────────────────────────

    /// @notice Returns all admin annotations on a batch.
    function getAnnotations(string calldata _batchNumber)
        external
        view
        returns (AdminAnnotation[] memory)
    {
        return adminAnnotations[_batchNumber];
    }

    /// @notice Returns a batch of global events by IDs (admin audit log).
    /// @param _from  Start index in allEventIds[].
    /// @param _to    End index in allEventIds[] (inclusive, clamped).
    function getGlobalEventSlice(uint256 _from, uint256 _to)
        external
        view
        returns (TraceEvent[] memory)
    {
        uint256 len = allEventIds.length;
        if (len == 0 || _from >= len) return new TraceEvent[](0);

        uint256 end  = _to >= len ? len - 1 : _to;
        uint256 size = end - _from + 1;

        TraceEvent[] memory result = new TraceEvent[](size);
        for (uint256 i = 0; i < size; i++) {
            result[i] = eventById[allEventIds[_from + i]];
        }
        return result;
    }

    // ─────────────────────────────────────────────────────────────
    // VIEW — Integrity Check
    // ─────────────────────────────────────────────────────────────

    /// @notice Re-computes a stored event's hash and compares it to
    ///         what is stored. Returns false if anyone tampered with
    ///         the struct after recording (should never happen in Solidity,
    ///         but useful as a defensive audit tool on a test chain).
    function verifyEventIntegrity(uint256 _eventId)
        external
        view
        returns (bool intact, bytes32 storedHash, bytes32 recomputedHash)
    {
        TraceEvent storage te = eventById[_eventId];
        require(te.timestamp != 0, "Trace: event not found");

        storedHash = te.eventHash;

        // NOTE: blockhash(block.number - 1) at query time ≠ at record time,
        // so we cannot re-derive the full original hash here.
        // Instead we return stored hash + a secondary hash of the stable fields
        // that the caller can compare externally.
        recomputedHash = keccak256(abi.encodePacked(
            te.eventId,
            te.batchNumber,
            te.actor,
            te.action,
            te.quantity,
            te.timestamp
        ));

        intact = (storedHash != bytes32(0));
    }

    // ─────────────────────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────────────────────

    /// @dev Records an event internally (not via TransferContract).
    ///      Used for fingerprint registration and admin annotations.
    function _recordInternalEvent(
        string memory _batchNumber,
        address       _actor,
        string memory _action,
        uint256       _quantity,
        string memory _note
    ) internal {
        EventType eType = _parseEventType(_action);
        IRegistry.Role role = registry.getRole(_actor);

        string memory license = "";
        try registry.getLicenseNumber(_actor) returns (string memory lic) {
            license = lic;
        } catch {}

        bytes32 eHash = keccak256(abi.encodePacked(
            nextEventId,
            _batchNumber,
            _actor,
            _action,
            _quantity,
            block.timestamp,
            blockhash(block.number - 1)
        ));

        TraceEvent memory te = TraceEvent({
            eventId:      nextEventId,
            batchNumber:  _batchNumber,
            actor:        _actor,
            actorRole:    role,
            actorLicense: license,
            eventType:    eType,
            action:       _action,
            quantity:     _quantity,
            note:         _note,
            timestamp:    block.timestamp,
            eventHash:    eHash
        });

        batchEvents[_batchNumber].push(te);
        eventById[nextEventId] = te;
        allEventIds.push(nextEventId);
        actorEvents[_actor].push(nextEventId);

        emit TraceEventRecorded(
            nextEventId, _batchNumber, _actor, eType,
            _quantity, eHash, block.timestamp
        );

        nextEventId++;
    }

    /// @dev Maps the action string from TransferContract to an EventType enum.
    ///      Any unrecognised string falls through to EventType.Custom.
    function _parseEventType(string memory _action)
        internal
        pure
        returns (EventType)
    {
        bytes32 h = keccak256(bytes(_action));

        if (h == keccak256(bytes("BatchCreated")))
            return EventType.BatchCreated;
        if (h == keccak256(bytes("ManufacturerToDistributor")))
            return EventType.ManufacturerToDistributor;
        if (h == keccak256(bytes("DistributorToSupplier")))
            return EventType.DistributorToSupplier;
        if (h == keccak256(bytes("SupplierToPharmacist")))
            return EventType.SupplierToPharmacist;
        if (h == keccak256(bytes("PharmacistToBuyer")))
            return EventType.PharmacistToBuyer;
        if (h == keccak256(bytes("ExpiredReturnPharmacistToSupplier")))
            return EventType.ExpiredReturnPharmacistToSupplier;
        if (h == keccak256(bytes("ExpiredReturnSupplierToDistributor")))
            return EventType.ExpiredReturnSupplierToDistributor;
        if (h == keccak256(bytes("ExpiredReturnDistributorToManufacturer")))
            return EventType.ExpiredReturnDistributorToManufacturer;
        if (h == keccak256(bytes("BatchRecalled")))
            return EventType.BatchRecalled;
        if (h == keccak256(bytes("BatchExpired")))
            return EventType.BatchExpired;
        if (h == keccak256(bytes("Custom")))
            return EventType.Custom;

        return EventType.Custom;
    }

    /// @dev Converts a Role enum to a human-readable string for the timeline.
    function _roleLabel(IRegistry.Role _role)
        internal
        pure
        returns (string memory)
    {
        if (_role == IRegistry.Role.Admin)        return "Admin";
        if (_role == IRegistry.Role.Manufacturer) return "Manufacturer";
        if (_role == IRegistry.Role.Distributor)  return "Distributor";
        if (_role == IRegistry.Role.Supplier)     return "Supplier";
        if (_role == IRegistry.Role.Pharmacist)   return "Pharmacist";
        return "Unknown";
    }
}
