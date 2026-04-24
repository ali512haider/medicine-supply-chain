// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IProduct {
    enum BatchStatus { Active, Expired, Recalled, Depleted }

    function adjustStock(string calldata _batchNumber, address _from, address _to, uint256 _quantity) external;
    function deductSale(string calldata _batchNumber, address _pharmacist, uint256 _quantity) external;
    function getStockOf(string calldata _batchNumber, address _holder) external view returns (uint256);
    function getBatchStatus(string calldata _batchNumber) external view returns (IProduct.BatchStatus);
    function batchExistsCheck(string calldata _batchNumber) external view returns (bool);
    function isBatchValid(string calldata _batchNumber) external view returns (bool);
    function getQRData(string calldata _batchNumber) external view returns (string memory qrCodeCID, string memory metadataCID);
    function getBatch(string calldata _batchNumber) external view returns (
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
