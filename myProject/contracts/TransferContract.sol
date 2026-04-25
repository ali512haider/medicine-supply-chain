// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IRegistry.sol";
import "./IProduct.sol";

interface ITrace {
    function recordEvent(string calldata b, address a, string calldata ac, uint256 q, string calldata n) external;
}

contract TransferContract {
    IRegistry public immutable registry;
    IProduct  public immutable product;
    ITrace    public            trace;
    bool      public            traceSet;

    enum TransferStatus { Pending, Accepted, Rejected, Cancelled }
    enum TransferDirection { MFR_TO_DIST, DIST_TO_SUPP, SUPP_TO_PHARM, PHARM_TO_BUYER }

    struct TransferRequest {
        uint256           id;
        TransferDirection direction;
        TransferStatus    status;
        string            batchNumber;
        address           sender;
        address           receiver;
        uint256           quantity;
        uint256           pricePerUnit;
        string            currency;
        string            note;
        uint256           createdAt;
        uint256           resolvedAt;
        bytes32           transferHash;
    }

    struct SaleRecord {
        uint256 saleId;
        string  batchNumber;
        address pharmacist;
        uint256 quantity;
        uint256 pricePerUnit;
        string  currency;
        string  buyerNote;
        uint256 soldAt;
        bytes32 saleHash;
    }

    struct CustodyEntry {
        address holder;
        uint256 timestamp;
        string  action;
    }

    mapping(address => mapping(address => bool)) private whitelist;
    mapping(address => address[])                private whitelistList;
    uint256 private nextTransferId = 1;
    mapping(uint256 => TransferRequest) private transfers;
    mapping(address => uint256[]) private senderTransfers;
    mapping(address => uint256[]) private receiverTransfers;
    mapping(string => uint256[]) private batchTransfers;
    uint256 private nextSaleId = 1;
    mapping(uint256 => SaleRecord)  private sales;
    mapping(address => uint256[])   private pharmacistSales;
    mapping(string  => uint256[])   private batchSales;
    mapping(string => address) private currentOwner;
    mapping(string => CustodyEntry[]) private custodyChain;

    event DistributorAdded(address indexed m, address indexed d, uint256 t);
    event DistributorRemoved(address indexed m, address indexed d, uint256 t);
    event SupplierAdded(address indexed d, address indexed s, uint256 t);
    event SupplierRemoved(address indexed d, address indexed s, uint256 t);
    event PharmacistAdded(address indexed s, address indexed p, uint256 t);
    event PharmacistRemoved(address indexed s, address indexed p, uint256 t);
    event TransferRequested(uint256 indexed id, TransferDirection dir, string indexed b, address indexed s, address r, uint256 q, uint256 t);
    event TransferAccepted(uint256 indexed id, address indexed r, bytes32 h, uint256 t);
    event TransferRejected(uint256 indexed id, address indexed r, string rs, uint256 t);
    event TransferCancelled(uint256 indexed id, address indexed s, uint256 t);
    event MedicineSold(uint256 indexed id, string indexed b, address indexed p, uint256 q, bytes32 h, uint256 t);
    event OwnershipUpdated(string indexed b, address indexed prev, address indexed next, uint256 t);
    event TraceContractSet(address indexed tr, uint256 t);

    constructor(address _r, address _p) {
        registry = IRegistry(_r);
        product  = IProduct(_p);
    }

    function setTraceContract(address _t) external {
        require(msg.sender == registry.admin(), "Admin only");
        require(!traceSet, "Already set");
        trace = ITrace(_t);
        traceSet = true;
        emit TraceContractSet(_t, block.timestamp);
    }

    function _updateWhitelist(address _r, bool _add, IRegistry.Role _role, string memory _msg) internal {
        require(registry.isApprovedWithRole(_r, _role), _msg);
        if (_add) {
            require(!whitelist[msg.sender][_r], "Exists");
            whitelist[msg.sender][_r] = true;
            whitelistList[msg.sender].push(_r);
        } else {
            require(whitelist[msg.sender][_r], "Not in list");
            whitelist[msg.sender][_r] = false;
            _removeFromList(whitelistList[msg.sender], _r);
        }
    }

    function addDistributor(address _d) external { _updateWhitelist(_d, true, IRegistry.Role.Distributor, "Not Dist"); emit DistributorAdded(msg.sender, _d, block.timestamp); }
    function removeDistributor(address _d) external { _updateWhitelist(_d, false, IRegistry.Role.Distributor, "Not Dist"); emit DistributorRemoved(msg.sender, _d, block.timestamp); }
    function addSupplier(address _s) external { _updateWhitelist(_s, true, IRegistry.Role.Supplier, "Not Supp"); emit SupplierAdded(msg.sender, _s, block.timestamp); }
    function removeSupplier(address _s) external { _updateWhitelist(_s, false, IRegistry.Role.Supplier, "Not Supp"); emit SupplierRemoved(msg.sender, _s, block.timestamp); }
    function addPharmacist(address _p) external { _updateWhitelist(_p, true, IRegistry.Role.Pharmacist, "Not Pharm"); emit PharmacistAdded(msg.sender, _p, block.timestamp); }
    function removePharmacist(address _p) external { _updateWhitelist(_p, false, IRegistry.Role.Pharmacist, "Not Pharm"); emit PharmacistRemoved(msg.sender, _p, block.timestamp); }

    function requestTransfer(TransferDirection _dir, string calldata _b, address _r, uint256 _q, uint256 _p, string calldata _c, string calldata _n) external returns (uint256) {
        require(product.isBatchValid(_b), "Invalid batch");
        require(whitelist[msg.sender][_r], "Not whitelisted");
        require(_q > 0 && product.getStockOf(_b, msg.sender) >= _q, "Stock/Qty error");
        return _createTransferRequest(_dir, _b, msg.sender, _r, _q, _p, _c, _n);
    }

    function acceptTransfer(uint256 _id, string calldata _n) external {
        TransferRequest storage req = transfers[_id];
        require(req.createdAt != 0 && req.status == TransferStatus.Pending, "Not Pending");
        require(msg.sender == req.receiver && registry.isApproved(msg.sender), "Unauthorized");
        require(product.getStockOf(req.batchNumber, req.sender) >= req.quantity, "Stock error");

        product.adjustStock(req.batchNumber, req.sender, req.receiver, req.quantity);
        bytes32 h = keccak256(abi.encodePacked(_id, req.batchNumber, req.sender, req.receiver, req.quantity, block.timestamp));
        req.status = TransferStatus.Accepted;
        req.resolvedAt = block.timestamp;
        req.transferHash = h;

        _recordOwnershipChange(req.batchNumber, req.sender, req.receiver, _directionLabel(req.direction), req.quantity, _n);
        emit TransferAccepted(_id, req.receiver, h, block.timestamp);
    }

    function rejectTransfer(uint256 _id, string calldata _r) external {
        TransferRequest storage req = transfers[_id];
        require(req.createdAt != 0 && req.status == TransferStatus.Pending, "Not Pending");
        require(msg.sender == req.receiver, "Unauthorized");
        req.status = TransferStatus.Rejected;
        req.resolvedAt = block.timestamp;
        req.note = _r;
        emit TransferRejected(_id, msg.sender, _r, block.timestamp);
    }

    function cancelTransfer(uint256 _id) external {
        TransferRequest storage req = transfers[_id];
        require(req.createdAt != 0 && req.status == TransferStatus.Pending, "Not Pending");
        require(msg.sender == req.sender, "Unauthorized");
        req.status = TransferStatus.Cancelled;
        req.resolvedAt = block.timestamp;
        emit TransferCancelled(_id, msg.sender, block.timestamp);
    }

    function directTransfer(string calldata _b, address _to, uint256 _q, TransferDirection _dir, string calldata _n) external {
        require(product.isBatchValid(_b) && whitelist[msg.sender][_to], "Invalid/Whitelist");
        require(_q > 0 && product.getStockOf(_b, msg.sender) >= _q, "Stock/Qty");
        product.adjustStock(_b, msg.sender, _to, _q);
        _recordOwnershipChange(_b, msg.sender, _to, _directionLabel(_dir), _q, _n);
    }

    function sellToBuyer(string calldata _b, uint256 _q, uint256 _p, string calldata _c, string calldata _n) external {
        require(registry.isApprovedWithRole(msg.sender, IRegistry.Role.Pharmacist), "Not Pharm");
        require(product.isBatchValid(_b) && _q > 0 && product.getStockOf(_b, msg.sender) >= _q, "Error");
        product.deductSale(_b, msg.sender, _q);
        bytes32 h = keccak256(abi.encodePacked(nextSaleId, _b, msg.sender, _q, block.timestamp));
        sales[nextSaleId] = SaleRecord(nextSaleId, _b, msg.sender, _q, _p, _c, _n, block.timestamp, h);
        pharmacistSales[msg.sender].push(nextSaleId);
        batchSales[_b].push(nextSaleId);
        if (traceSet) trace.recordEvent(_b, msg.sender, "PharmacistToBuyer", _q, _n);
        emit MedicineSold(nextSaleId, _b, msg.sender, _q, h, block.timestamp);
        nextSaleId++;
    }

    function returnExpired(string calldata _b, address _to, uint256 _q, string calldata _n, string calldata _act) external {
        require(!product.isBatchValid(_b) && _q > 0 && product.getStockOf(_b, msg.sender) >= _q, "Error");
        product.adjustStock(_b, msg.sender, _to, _q);
        if (traceSet) trace.recordEvent(_b, msg.sender, _act, _q, _n);
        _recordCustodyEntry(_b, _to, _act);
        emit OwnershipUpdated(_b, msg.sender, _to, block.timestamp);
    }

    function getDistributors(address _m) external view returns (address[] memory) { return whitelistList[_m]; }
    function getSuppliers(address _d) external view returns (address[] memory) { return whitelistList[_d]; }
    function getPharmacists(address _s) external view returns (address[] memory) { return whitelistList[_s]; }
    function isDistributorOf(address _m, address _d) external view returns (bool) { return whitelist[_m][_d]; }
    function isSupplierOf(address _d, address _s) external view returns (bool) { return whitelist[_d][_s]; }
    function isPharmacistOf(address _s, address _p) external view returns (bool) { return whitelist[_s][_p]; }

    function getTransfer(uint256 _id) external view returns (TransferRequest memory) { return transfers[_id]; }
    function getSentTransfers(address _s) external view returns (uint256[] memory) { return senderTransfers[_s]; }
    function getReceivedTransfers(address _r) external view returns (uint256[] memory) { return receiverTransfers[_r]; }
    function getBatchTransfers(string calldata _b) external view returns (uint256[] memory) { return batchTransfers[_b]; }

    function getMyPendingInbox() external view returns (TransferRequest[] memory) {
        uint256[] storage ids = receiverTransfers[msg.sender];
        uint256 count = 0;
        for (uint256 i = 0; i < ids.length; i++) if (transfers[ids[i]].status == TransferStatus.Pending) count++;
        TransferRequest[] memory res = new TransferRequest[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < ids.length; i++) if (transfers[ids[i]].status == TransferStatus.Pending) res[idx++] = transfers[ids[i]];
        return res;
    }

    function getMyPendingOutbox() external view returns (TransferRequest[] memory) {
        uint256[] storage ids = senderTransfers[msg.sender];
        uint256 count = 0;
        for (uint256 i = 0; i < ids.length; i++) if (transfers[ids[i]].status == TransferStatus.Pending) count++;
        TransferRequest[] memory res = new TransferRequest[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < ids.length; i++) if (transfers[ids[i]].status == TransferStatus.Pending) res[idx++] = transfers[ids[i]];
        return res;
    }

    function getCurrentOwner(string calldata _b) external view returns (address) { return currentOwner[_b]; }
    function getCustodyChain(string calldata _b) external view returns (CustodyEntry[] memory) { return custodyChain[_b]; }
    function getSale(uint256 _id) external view returns (SaleRecord memory) { require(sales[_id].soldAt != 0, "Not found"); return sales[_id]; }
    function getSalesByPharmacist(address _p) external view returns (uint256[] memory) { return pharmacistSales[_p]; }
    function getSalesByBatch(string calldata _b) external view returns (uint256[] memory) { return batchSales[_b]; }

    function getTotalSoldForBatch(string calldata _b) external view returns (uint256 total) {
        uint256[] storage ids = batchSales[_b];
        for (uint256 i = 0; i < ids.length; i++) total += sales[ids[i]].quantity;
    }

    function getAcceptedTransferCount(string calldata _b) external view returns (uint256 count) {
        uint256[] storage ids = batchTransfers[_b];
        for (uint256 i = 0; i < ids.length; i++) if (transfers[ids[i]].status == TransferStatus.Accepted) count++;
    }

    function _createTransferRequest(TransferDirection _dir, string calldata _b, address _s, address _r, uint256 _q, uint256 _p, string calldata _c, string calldata _n) internal returns (uint256 id) {
        id = nextTransferId++;
        TransferRequest storage req = transfers[id];
        req.id = id; req.direction = _dir; req.status = TransferStatus.Pending; req.batchNumber = _b; req.sender = _s; req.receiver = _r; req.quantity = _q; req.pricePerUnit = _p; req.currency = _c; req.note = _n; req.createdAt = block.timestamp;
        senderTransfers[_s].push(id); receiverTransfers[_r].push(id); batchTransfers[_b].push(id);
        emit TransferRequested(id, _dir, _b, _s, _r, _q, block.timestamp);
    }

    function _recordOwnershipChange(string memory _b, address _prev, address _to, string memory _act, uint256 _q, string calldata _n) internal {
        currentOwner[_b] = _to;
        _recordCustodyEntry(_b, _to, _act);
        if (traceSet) trace.recordEvent(_b, _to, _act, _q, _n);
        emit OwnershipUpdated(_b, _prev, _to, block.timestamp);
    }

    function _recordCustodyEntry(string memory _b, address _h, string memory _a) internal {
        custodyChain[_b].push(CustodyEntry(_h, block.timestamp, _a));
    }

    function _directionLabel(TransferDirection _d) internal pure returns (string memory) {
        if (_d == TransferDirection.MFR_TO_DIST) return "ManufacturerToDistributor";
        if (_d == TransferDirection.DIST_TO_SUPP) return "DistributorToSupplier";
        if (_d == TransferDirection.SUPP_TO_PHARM) return "SupplierToPharmacist";
        return "PharmacistToBuyer";
    }

    function _removeFromList(address[] storage _l, address _a) internal {
        for (uint256 i = 0; i < _l.length; i++) {
            if (_l[i] == _a) {
                _l[i] = _l[_l.length - 1];
                _l.pop();
                break;
            }
        }
    }
}
