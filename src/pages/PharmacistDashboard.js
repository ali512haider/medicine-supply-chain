import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';

export default function PharmacistDashboard() {
  const { contracts, account } = useWeb3();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Pharmacist Dashboard</h1>
      <p>Redesign in progress... This will be your command center to receive stock from Suppliers and sell to Patients.</p>
    </div>
  );
}
