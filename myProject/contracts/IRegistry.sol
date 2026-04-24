// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IRegistry {
    enum Role {
        None,
        Admin,
        Manufacturer,
        Distributor,
        Supplier,
        Pharmacist
    }

    function isApprovedWithRole(address _addr, IRegistry.Role _role) external view returns (bool);
    function isApproved(address _addr) external view returns (bool);
    function getRole(address _addr) external view returns (IRegistry.Role);
    function admin() external view returns (address);
    function getLicenseNumber(address _addr) external view returns (string memory);
}
