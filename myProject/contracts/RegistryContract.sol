// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title  RegistryContract
/// @notice Central identity & access-control registry for the
///         Blockchain-Based Medicine Supply Chain system.
///         All other contracts query this contract to verify
///         that a caller is approved and holds the correct role.
/// @dev    Deploy this contract first; pass its address to the
///         constructor of ProductContract, TransferContract and
///         TraceContract.
contract RegistryContract {

    // ─────────────────────────────────────────────────────────────
    // Enums
    // ─────────────────────────────────────────────────────────────

    /// @dev Roles a wallet address can hold in the system.
    ///      Unregistered wallets have role = None.
    enum Role {
        None,           // 0 – not registered
        Admin,          // 1
        Manufacturer,   // 2
        Distributor,    // 3
        Supplier,       // 4
        Pharmacist      // 5
    }

    /// @dev Lifecycle of a registration request.
    enum ApprovalStatus {
        None,       // 0 – never applied
        Pending,    // 1 – awaiting admin decision
        Approved,   // 2 – active in the system
        Rejected,   // 3 – denied by admin
        Revoked     // 4 – previously approved, now disabled
    }

    // ─────────────────────────────────────────────────────────────
    // Structs
    // ─────────────────────────────────────────────────────────────

    struct Entity {
        address         walletAddress;
        Role            role;
        ApprovalStatus  status;
        string          name;
        string          email;
        string          location;
        string          licenseNumber;   // assigned by admin on approval
        uint256         registeredAt;    // block.timestamp of registration request
        uint256         approvedAt;      // block.timestamp of admin approval (0 if not yet)
        bool            exists;          // guard for mapping lookup
    }

    // ─────────────────────────────────────────────────────────────
    // State Variables
    // ─────────────────────────────────────────────────────────────

    address public admin;

    /// @dev Primary registry: wallet → Entity
    mapping(address => Entity) private entities;

    /// @dev All addresses that have ever submitted a registration request
    address[] private allRegistered;

    /// @dev Addresses currently awaiting admin decision
    address[] private pendingList;

    /// @dev Quick set-membership for pendingList (avoid O(n) scan on removal)
    mapping(address => bool) private isPending;

    /// @dev License number uniqueness guard: licenseNo → assigned address
    mapping(string => address) private licenseToAddress;

    // ─────────────────────────────────────────────────────────────
    // Events
    // ─────────────────────────────────────────────────────────────

    event AdminTransferred(address indexed previousAdmin, address indexed newAdmin);

    event RegistrationRequested(
        address indexed applicant,
        Role    indexed role,
        string          name,
        uint256         timestamp
    );

    event EntityApproved(
        address indexed entity,
        Role    indexed role,
        string          licenseNumber,
        address indexed approvedBy,
        uint256         timestamp
    );

    event EntityRejected(
        address indexed entity,
        address indexed rejectedBy,
        uint256         timestamp
    );

    event EntityRevoked(
        address indexed entity,
        address indexed revokedBy,
        uint256         timestamp
    );

    event EntityReactivated(
        address indexed entity,
        address indexed reactivatedBy,
        uint256         timestamp
    );

    event EntityDetailsUpdated(
        address indexed entity,
        uint256         timestamp
    );

    // ─────────────────────────────────────────────────────────────
    // Modifiers
    // ─────────────────────────────────────────────────────────────

    modifier onlyAdmin() {
        require(msg.sender == admin, "Registry: caller is not admin");
        _;
    }

    modifier onlyApproved() {
        require(
            entities[msg.sender].status == ApprovalStatus.Approved,
            "Registry: caller is not an approved entity"
        );
        _;
    }

    modifier notAlreadyRegistered() {
        require(
            !entities[msg.sender].exists,
            "Registry: address already has a registration record"
        );
        _;
    }

    modifier entityExists(address _addr) {
        require(entities[_addr].exists, "Registry: entity does not exist");
        _;
    }

    // ─────────────────────────────────────────────────────────────
    // Constructor
    // ─────────────────────────────────────────────────────────────

    /// @param _admin The wallet address that will act as system admin.
    ///               Typically the deployer's address.
    constructor(address _admin) {
        require(_admin != address(0), "Registry: admin cannot be zero address");
        admin = _admin;

        // Register admin entity internally (no approval needed)
        entities[_admin] = Entity({
            walletAddress:  _admin,
            role:           Role.Admin,
            status:         ApprovalStatus.Approved,
            name:           "System Admin",
            email:          "",
            location:       "",
            licenseNumber:  "ADMIN-001",
            registeredAt:   block.timestamp,
            approvedAt:     block.timestamp,
            exists:         true
        });

        allRegistered.push(_admin);
        licenseToAddress["ADMIN-001"] = _admin;

        emit EntityApproved(_admin, Role.Admin, "ADMIN-001", _admin, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────
    // Registration (Public — called by applicants)
    // ─────────────────────────────────────────────────────────────

    /// @notice Submit a signup request. Admin must approve before the
    ///         entity can interact with other contracts.
    /// @param  _role     One of: Manufacturer(2), Distributor(3),
    ///                   Supplier(4), Pharmacist(5). Cannot self-register as Admin.
    /// @param  _name     Full legal name / business name.
    /// @param  _email    Contact email (stored off-chain ref only).
    /// @param  _location City / address string.
    function requestRegistration(
        Role   _role,
        string calldata _name,
        string calldata _email,
        string calldata _location
    )
        external
        notAlreadyRegistered
    {
        require(
            _role == Role.Manufacturer ||
            _role == Role.Distributor  ||
            _role == Role.Supplier     ||
            _role == Role.Pharmacist,
            "Registry: invalid role for self-registration"
        );
        require(bytes(_name).length > 0,     "Registry: name cannot be empty");
        require(bytes(_email).length > 0,    "Registry: email cannot be empty");
        require(bytes(_location).length > 0, "Registry: location cannot be empty");

        entities[msg.sender] = Entity({
            walletAddress:  msg.sender,
            role:           _role,
            status:         ApprovalStatus.Pending,
            name:           _name,
            email:          _email,
            location:       _location,
            licenseNumber:  "",           // assigned by admin later
            registeredAt:   block.timestamp,
            approvedAt:     0,
            exists:         true
        });

        allRegistered.push(msg.sender);
        pendingList.push(msg.sender);
        isPending[msg.sender] = true;

        emit RegistrationRequested(msg.sender, _role, _name, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────
    // Admin — Approval / Rejection / Revocation
    // ─────────────────────────────────────────────────────────────

    /// @notice Approve a pending registration and assign a license number.
    /// @param  _entity     Applicant wallet address.
    /// @param  _licenseNo  Unique license string (e.g. "MFR-2024-001").
    function approveEntity(address _entity, string calldata _licenseNo)
        external
        onlyAdmin
        entityExists(_entity)
    {
        Entity storage e = entities[_entity];

        require(
            e.status == ApprovalStatus.Pending,
            "Registry: entity is not in Pending status"
        );
        require(bytes(_licenseNo).length > 0, "Registry: license number cannot be empty");
        require(
            licenseToAddress[_licenseNo] == address(0),
            "Registry: license number already assigned"
        );

        e.status        = ApprovalStatus.Approved;
        e.licenseNumber = _licenseNo;
        e.approvedAt    = block.timestamp;

        licenseToAddress[_licenseNo] = _entity;
        _removeFromPending(_entity);

        emit EntityApproved(_entity, e.role, _licenseNo, msg.sender, block.timestamp);
    }

    /// @notice Reject a pending registration request.
    function rejectEntity(address _entity)
        external
        onlyAdmin
        entityExists(_entity)
    {
        Entity storage e = entities[_entity];

        require(
            e.status == ApprovalStatus.Pending,
            "Registry: entity is not in Pending status"
        );

        e.status = ApprovalStatus.Rejected;
        _removeFromPending(_entity);

        emit EntityRejected(_entity, msg.sender, block.timestamp);
    }

    /// @notice Revoke an already-approved entity (e.g. license violation).
    ///         The entity's on-chain record is preserved for audit purposes
    ///         but isApproved() will return false.
    function revokeEntity(address _entity)
        external
        onlyAdmin
        entityExists(_entity)
    {
        Entity storage e = entities[_entity];

        require(
            e.status == ApprovalStatus.Approved,
            "Registry: entity is not currently Approved"
        );

        e.status = ApprovalStatus.Revoked;

        emit EntityRevoked(_entity, msg.sender, block.timestamp);
    }

    /// @notice Re-approve a previously rejected or revoked entity
    ///         (e.g. after appeal), keeping the same license number.
    function reactivateEntity(address _entity)
        external
        onlyAdmin
        entityExists(_entity)
    {
        Entity storage e = entities[_entity];

        require(
            e.status == ApprovalStatus.Rejected ||
            e.status == ApprovalStatus.Revoked,
            "Registry: entity is not in Rejected or Revoked status"
        );
        require(
            bytes(e.licenseNumber).length > 0,
            "Registry: no license number on record; use approveEntity instead"
        );

        e.status     = ApprovalStatus.Approved;
        e.approvedAt = block.timestamp;

        emit EntityReactivated(_entity, msg.sender, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────
    // Admin — Update Entity Details
    // ─────────────────────────────────────────────────────────────

    /// @notice Admin can correct or update an entity's profile fields.
    ///         Does NOT change role or approval status.
    function updateEntityDetails(
        address        _entity,
        string calldata _name,
        string calldata _email,
        string calldata _location
    )
        external
        onlyAdmin
        entityExists(_entity)
    {
        require(bytes(_name).length > 0, "Registry: name cannot be empty");

        Entity storage e = entities[_entity];
        e.name     = _name;
        e.email    = _email;
        e.location = _location;

        emit EntityDetailsUpdated(_entity, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────
    // Self-Update (Approved entities only)
    // ─────────────────────────────────────────────────────────────

    /// @notice Approved entities can update their own email and location.
    ///         Name and role changes require admin action.
    function updateMyDetails(
        string calldata _email,
        string calldata _location
    )
        external
        onlyApproved
    {
        Entity storage e = entities[msg.sender];
        e.email    = _email;
        e.location = _location;

        emit EntityDetailsUpdated(msg.sender, block.timestamp);
    }

    // ─────────────────────────────────────────────────────────────
    // Admin Transfer
    // ─────────────────────────────────────────────────────────────

    /// @notice Transfer admin rights to a new wallet.
    ///         The new admin must already be an approved entity OR
    ///         be a fresh address (role becomes Admin).
    function transferAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Registry: zero address");
        require(_newAdmin != admin,      "Registry: already admin");

        address oldAdmin = admin;
        admin = _newAdmin;

        // Update the old admin entity record
        entities[oldAdmin].role   = Role.None;
        entities[oldAdmin].status = ApprovalStatus.Revoked;

        // Create or update new admin record
        if (!entities[_newAdmin].exists) {
            entities[_newAdmin] = Entity({
                walletAddress:  _newAdmin,
                role:           Role.Admin,
                status:         ApprovalStatus.Approved,
                name:           "System Admin",
                email:          "",
                location:       "",
                licenseNumber:  "ADMIN-TRANSFER",
                registeredAt:   block.timestamp,
                approvedAt:     block.timestamp,
                exists:         true
            });
            allRegistered.push(_newAdmin);
        } else {
            entities[_newAdmin].role   = Role.Admin;
            entities[_newAdmin].status = ApprovalStatus.Approved;
        }

        emit AdminTransferred(oldAdmin, _newAdmin);
    }

    // ─────────────────────────────────────────────────────────────
    // View / Query Functions (called by other contracts & frontend)
    // ─────────────────────────────────────────────────────────────

    /// @notice Primary guard used by other contracts.
    ///         Returns true only if the address is Approved AND holds the expected role.
    function isApprovedWithRole(address _addr, Role _role)
        external
        view
        returns (bool)
    {
        Entity storage e = entities[_addr];
        return e.exists &&
               e.status == ApprovalStatus.Approved &&
               e.role   == _role;
    }

    /// @notice Returns true if the address is approved for ANY valid role.
    function isApproved(address _addr) external view returns (bool) {
        return entities[_addr].exists &&
               entities[_addr].status == ApprovalStatus.Approved;
    }

    /// @notice Returns the role of an address regardless of approval status.
    function getRole(address _addr) external view returns (Role) {
        return entities[_addr].role;
    }

    /// @notice Returns the approval status of an address.
    function getStatus(address _addr) external view returns (ApprovalStatus) {
        return entities[_addr].status;
    }

    /// @notice Returns full entity record for an address.
    function getEntity(address _addr)
        external
        view
        entityExists(_addr)
        returns (Entity memory)
    {
        return entities[_addr];
    }

    /// @notice Lookup an entity by license number.
    function getEntityByLicense(string calldata _licenseNo)
        external
        view
        returns (Entity memory)
    {
        address addr = licenseToAddress[_licenseNo];
        require(addr != address(0), "Registry: license not found");
        return entities[addr];
    }

    /// @notice Returns all pending registration requests (for the admin dashboard).
    function getPendingRequests() external view returns (address[] memory) {
        return pendingList;
    }

    /// @notice Returns the full list of pending requests with their Entity details.
    ///         Useful for the admin panel to render a table in one call.
    function getPendingEntities() external view returns (Entity[] memory) {
        uint256 len = pendingList.length;
        Entity[] memory result = new Entity[](len);
        for (uint256 i = 0; i < len; i++) {
            result[i] = entities[pendingList[i]];
        }
        return result;
    }

    /// @notice Returns all registered addresses (approved + pending + rejected + revoked).
    function getAllRegistered() external view returns (address[] memory) {
        return allRegistered;
    }

    /// @notice Returns all entities of a specific role that are Approved.
    ///         Used by Manufacturer to list available Distributors, etc.
    function getApprovedByRole(Role _role)
        external
        view
        returns (Entity[] memory)
    {
        // First pass: count
        uint256 count = 0;
        for (uint256 i = 0; i < allRegistered.length; i++) {
            Entity storage e = entities[allRegistered[i]];
            if (e.role == _role && e.status == ApprovalStatus.Approved) {
                count++;
            }
        }

        // Second pass: fill
        Entity[] memory result = new Entity[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < allRegistered.length; i++) {
            Entity storage e = entities[allRegistered[i]];
            if (e.role == _role && e.status == ApprovalStatus.Approved) {
                result[idx] = e;
                idx++;
            }
        }
        return result;
    }

    /// @notice Returns the license number assigned to an address.
    ///         Returns empty string if not yet assigned.
    function getLicenseNumber(address _addr)
        external
        view
        returns (string memory)
    {
        return entities[_addr].licenseNumber;
    }

    /// @notice Returns the wallet address registered under a given license number.
    ///         Returns address(0) if not found.
    function getAddressByLicense(string calldata _licenseNo)
        external
        view
        returns (address)
    {
        return licenseToAddress[_licenseNo];
    }

    // ─────────────────────────────────────────────────────────────
    // Internal Helpers
    // ─────────────────────────────────────────────────────────────

    /// @dev Removes an address from the pendingList array and
    ///      clears its isPending flag. Uses swap-and-pop for O(n) removal.
    function _removeFromPending(address _addr) internal {
        if (!isPending[_addr]) return;

        isPending[_addr] = false;

        uint256 len = pendingList.length;
        for (uint256 i = 0; i < len; i++) {
            if (pendingList[i] == _addr) {
                pendingList[i] = pendingList[len - 1];
                pendingList.pop();
                break;
            }
        }
    }
}
