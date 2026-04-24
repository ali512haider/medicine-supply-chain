import React, { useState } from 'react';
import { useWeb3 } from '../context/Web3Context';

export default function ManufacturerDashboard() {
  const { contracts, account } = useWeb3();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    batchNumber: '',
    productName: '',
    genericName: '',
    dosageForm: 'Tablet',
    strength: '',
    manufacturerName: '',
    costPerUnit: '0',
    currency: 'USD',
    mfgDate: '',
    expiryDate: '',
    totalQuantity: '0'
  });

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleAddBatch = async (e) => {
    e.preventDefault();
    if (!contracts.product) return;

    try {
      setLoading(true);
      setMessage('Creating batch on blockchain...');
      
      const mfgUnix = Math.floor(new Date(formData.mfgDate).getTime() / 1000);
      const expUnix = Math.floor(new Date(formData.expiryDate).getTime() / 1000);

      // Dummy raw materials for simplicity in MVP
      const rmNames = ["Active Ingredient X"];
      const rmQuantities = [100];
      const rmUnits = ["mg"];

      const tx = await contracts.product.addBatch(
        formData.batchNumber,
        formData.productName,
        formData.genericName,
        formData.dosageForm,
        formData.strength,
        formData.manufacturerName,
        rmNames,
        rmQuantities,
        rmUnits,
        formData.costPerUnit,
        formData.currency,
        mfgUnix,
        expUnix,
        formData.totalQuantity
      );

      await tx.wait();
      setMessage('Batch created successfully!');
    } catch (err) {
      console.error(err);
      setMessage(err.reason || err.message || 'Failed to create batch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-content animate-fade-in">
      <h1 className="gradient-text">Manufacturer Dashboard</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Register new medicine batches to the blockchain.</p>

      <div className="glass-panel" style={{ marginTop: '2rem', maxWidth: '600px' }}>
        <h2>Add New Batch</h2>
        
        {message && (
          <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', borderRadius: '8px', marginBottom: '1.5rem' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleAddBatch}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Batch Number</label>
              <input type="text" className="form-input" name="batchNumber" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Product Name</label>
              <input type="text" className="form-input" name="productName" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Generic Name</label>
              <input type="text" className="form-input" name="genericName" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Total Quantity</label>
              <input type="number" className="form-input" name="totalQuantity" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Mfg Date</label>
              <input type="date" className="form-input" name="mfgDate" onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Expiry Date</label>
              <input type="date" className="form-input" name="expiryDate" onChange={handleChange} required />
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Processing...' : 'Create Batch'}
          </button>
        </form>
      </div>
    </div>
  );
}
