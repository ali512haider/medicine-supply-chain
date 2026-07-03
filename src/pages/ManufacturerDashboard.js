import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import Modal from '../components/Modal';
import QRCodeDisplay from '../components/QRCodeDisplay';

// --- Professional Emerald SVG Icons ---
const Icons = {
  Overview: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
  ),
  Add: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
  ),
  Transfer: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
  ),
  Distributors: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
  ),
  Alert: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
  ),
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
  ),
  LogOut: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
  ),
  Trash: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
  ),
  Bell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
  )
};

export default function ManufacturerDashboard() {
  const { contracts, account, disconnectWallet } = useWeb3();
  const navigate = useNavigate();
  const handleLogout = () => { navigate('/'); disconnectWallet(); };
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const invoiceRef = useRef();

  // Modal State
  const [modal, setModal] = useState({ isOpen: false, title: '', batchNo: '' });
  const [recallReason, setRecallReason] = useState('');

  // Data State
  const [batches, setBatches] = useState([]);
  const [allDistributors, setAllDistributors] = useState([]);
  const [myDistributors, setMyDistributors] = useState([]);
  const [stats, setStats] = useState({ total: 0, stock: 0, expired: 0, recalled: 0 });
  const [actionMsg, setActionMsg] = useState('');

  // Form States
  const [newBatch, setNewBatch] = useState({ number: '', name: '', generic: '', mfg: '', exp: '', qty: '', price: '', currency: 'PKR', type: 'Tablet', strength: '500mg' });
  const [distToAdd, setDistToAdd] = useState('');

  // Multi-Batch Shipment State
  const [shipmentDistributor, setShipmentDistributor] = useState('');
  const [shipmentItems, setShipmentItems] = useState([]); 
  const [selectedBatch, setSelectedBatch] = useState('');
  const [lastInvoice, setLastInvoice] = useState(null);

  // Notification state & ref
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [entityName, setEntityName] = useState('Manufacturer');

  const fetchData = useCallback(async () => {
    if (!contracts.product || !contracts.registry || !account) return;
    setLoading(true);
    try {
      // Fetch My Entity Info
      const myEntity = await contracts.registry.getEntity(account);
      setEntityName(myEntity.name);

      const bNos = await contracts.product.getBatchesByManufacturer(account);
      const bList = [];
      let totalQty = 0, expiredCount = 0, recalledCount = 0;

      for (let bn of bNos) {
        const b = await contracts.product.getBatch(bn);
        const s = await contracts.product.getBatchStatus(bn);
        const qty = await contracts.product.getStockOf(bn, account);
        
        const isExpired = Number(b.expiryDate) * 1000 < Date.now();
        const isRecalled = Number(s) === 2;

        bList.push({
          batchNumber: bn,
          productName: b.productName,
          genericName: b.genericName,
          mfgDate: Number(b.mfgDate),
          expiryDate: Number(b.expiryDate),
          quantity: qty.toString(),
          price: b.costPerUnit.toString(),
          currency: b.currency,
          status: Number(s),
          isExpired,
          isRecalled
        });

        if (Number(qty) > 0) totalQty += Number(qty);
        if (isExpired) expiredCount++;
        if (isRecalled) recalledCount++;
      }
      setBatches(bList.reverse());
      setStats({ total: bNos.length, stock: totalQty, expired: expiredCount, recalled: recalledCount });

      const allAddrs = await contracts.registry.getAllRegistered();
      const dists = [];
      for (let addr of allAddrs) {
        const entity = await contracts.registry.getEntity(addr);
        if (Number(entity.role) === 3 && Number(entity.status) === 2) {
          dists.push({ address: addr, name: entity.name });
        }
      }
      setAllDistributors(dists);

      // Simple version getDistributors takes manufacturer address
      const myDists = await contracts.transfer.getDistributors(account);
      setMyDistributors(myDists.map(d => d.toLowerCase()));

    } catch (err) {
      console.error("Manufacturer Sync Error:", err);
      setActionMsg('❌ Sync Error');
    } finally {
      setLoading(false);
    }
  }, [contracts.product, contracts.registry, contracts.transfer, account]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      setActionMsg('⏳ Creating Batch...');
      const mfgTs = Math.floor(new Date(newBatch.mfg).getTime() / 1000);
      const expTs = Math.floor(new Date(newBatch.exp).getTime() / 1000);
      const qty = window.BigInt(newBatch.qty);
      const price = window.BigInt(newBatch.price);

      const tx = await contracts.product.addBatch(
        newBatch.number, newBatch.name, newBatch.generic, newBatch.type, newBatch.strength, "My Pharma",
        [], [], [], price, newBatch.currency, mfgTs, expTs, qty, "", ""
      );
      await tx.wait();
      setActionMsg('✅ Batch Created!');
      setNewBatch({ number: '', name: '', generic: '', mfg: '', exp: '', qty: '', price: '', currency: 'PKR', type: 'Tablet', strength: '500mg' });
      fetchData();
    } catch (err) { setActionMsg('❌ Creation Failed'); }
  };

  const handleAddDistributor = async () => {
    if (!distToAdd) return;
    try {
      setActionMsg('⏳ Authorizing...');
      const tx = await contracts.transfer.addDistributor(distToAdd);
      await tx.wait();
      setActionMsg('✅ Success!');
      setDistToAdd('');
      fetchData();
    } catch (err) { setActionMsg('❌ Auth Failed'); }
  };

  const handleRemoveDistributor = async (addr) => {
    try {
      setActionMsg('⏳ Unauthorizing Distributor...');
      const tx = await contracts.transfer.removeDistributor(addr);
      await tx.wait();
      setActionMsg('✅ Distributor Unauthorized');
      fetchData();
    } catch (err) { 
      console.error(err);
      setActionMsg('❌ Revocation Failed'); 
    }
  };

  const addBatchToShipment = () => {
    if (!selectedBatch) return;
    const batch = batches.find(b => b.batchNumber === selectedBatch);
    if (!batch) return;
    if (shipmentItems.find(i => i.batchNumber === selectedBatch)) return;

    setShipmentItems([...shipmentItems, { 
      batchNumber: batch.batchNumber, 
      productName: batch.productName,
      quantity: '', 
      price: batch.price,
      currency: batch.currency 
    }]);
    setSelectedBatch('');
  };

  const removeBatchFromShipment = (bn) => {
    setShipmentItems(shipmentItems.filter(i => i.batchNumber !== bn));
  };

  const updateShipmentItem = (bn, field, value) => {
    setShipmentItems(shipmentItems.map(i => i.batchNumber === bn ? { ...i, [field]: value } : i));
  };

  const handleBulkTransfer = async (e) => {
    if (e) e.preventDefault();
    if (!shipmentDistributor) {
      setActionMsg('⚠️ Select a Distributor');
      return;
    }
    if (shipmentItems.length === 0) {
      setActionMsg('⚠️ Add at least one batch');
      return;
    }

    try {
      setActionMsg('⏳ Initializing Blockchain Transfer...');
      
      if (!contracts.transfer) {
        setActionMsg('❌ Transfer Contract Missing');
        return;
      }

      const distributor = allDistributors.find(d => d.address.toLowerCase() === shipmentDistributor.toLowerCase());
      const results = [];

      for (const item of shipmentItems) {
        const nQty = Number(item.quantity);
        const nPrice = Number(item.price);
        
        if (isNaN(nQty) || nQty <= 0) continue;

        setActionMsg(`⏳ Shipping ${item.batchNumber}...`);
        
        const qtyBI = window.BigInt(Math.floor(nQty));
        const priceBI = window.BigInt(Math.floor(nPrice || 0));

        // CRITICAL FIX: Use generic requestTransfer as specialized functions 
        // are missing from the current deployed artifacts.
        // Direction 0 = ManufacturerToDistributor
        const tx = await contracts.transfer.requestTransfer(
          0, 
          item.batchNumber, 
          shipmentDistributor, 
          qtyBI, 
          priceBI, 
          item.currency || 'PKR', 
          "Bulk Supply Chain Dispatch"
        );
        
        console.log(`Transaction Sent for ${item.batchNumber}:`, tx.hash);
        await tx.wait();
        results.push({ ...item, total: nQty * nPrice });
      }

      if (results.length === 0) {
        setActionMsg('⚠️ No batches were shipped. Check quantities.');
        return;
      }

      setLastInvoice({
        distributor: distributor?.name || 'Authorized Distributor',
        distributorAddr: shipmentDistributor,
        items: results,
        grandTotal: results.reduce((sum, i) => sum + i.total, 0),
        currency: results[0]?.currency || 'PKR',
        date: new Date().toLocaleString()
      });

      setActionMsg('✅ Shipment Success!');
      setShipmentItems([]);
      setShipmentDistributor('');
      fetchData();
      setActiveTab('invoice');
    } catch (err) {
      console.error("CRITICAL BLOCKCHAIN ERROR:", err);
      const errMsg = err.reason || err.message || "Unknown error";
      setActionMsg('❌ Failed: ' + errMsg.slice(0, 40));
    }
  };

  const printInvoice = () => {
    const WindowPrt = window.open('', '', 'left=0,top=0,width=800,height=900');
    WindowPrt.document.write('<html><head><title>Shipping Invoice</title><style>body{font-family:sans-serif;padding:40px;color:#0f172a;} .header{text-align:center;margin-bottom:40px;color:#10b981;border-bottom:2px solid #f1f5f9;padding-bottom:20px;} .total-row{border-top:2px solid #0f172a;margin-top:20px;padding-top:10px;text-align:right;font-weight:800;font-size:1.2rem;}</style></head><body>');
    WindowPrt.document.write(invoiceRef.current.innerHTML);
    WindowPrt.document.write('</body></html>');
    WindowPrt.document.close();
    WindowPrt.focus();
    WindowPrt.print();
    WindowPrt.close();
  };

  const openRecallModal = (batchNo) => {
    setRecallReason('');
    setModal({ isOpen: true, title: 'Recall Batch', batchNo });
  };

  const handleRecall = async () => {
    if (!recallReason) return;
    try {
       setActionMsg('⏳ Recalling...');
       setModal({ ...modal, isOpen: false });
       const tx = await contracts.product.recallBatch(modal.batchNo, recallReason);
       await tx.wait();
       setActionMsg('✅ Recalled');
       fetchData();
    } catch (err) { setActionMsg('❌ Recall Failed'); }
  };

  const expiredBatches = batches.filter(b => b.isExpired);
  const notifications = [
    ...expiredBatches.map(b => ({
      id: `exp-${b.batchNumber}`,
      type: 'expiry',
      title: 'Expired Batch Alert',
      text: `Batch #${b.batchNumber} (${b.productName}) has expired.`,
      date: new Date(b.expiryDate * 1000).toLocaleDateString()
    }))
  ];

  return (
    <div style={styles.dashboardWrapper}>
      <Modal 
        isOpen={modal.isOpen} 
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        footer={
          <>
            <button className="btn btn-outline" onClick={() => setModal({ ...modal, isOpen: false })}>Cancel</button>
            <button className="btn btn-danger" onClick={handleRecall} style={{ background: '#ef4444', color: 'white', border: 'none' }}>Confirm Recall</button>
          </>
        }
      >
        <div className="form-group">
          <label className="form-label">Reason for Recall</label>
          <textarea 
            className="form-input" 
            placeholder="e.g. Quality issue detected..."
            value={recallReason}
            onChange={(e) => setRecallReason(e.target.value)}
            rows="3"
            autoFocus
          />
        </div>
      </Modal>

      {isMobile && sidebarOpen && <div style={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}
      <div style={{ ...styles.sidebar, left: sidebarOpen ? '0' : '-280px' }}>
        <div style={styles.sidebarBrand}>
          <span style={{ color: 'var(--accent-primary)' }}>MediTrace</span>
          <span style={styles.roleTag}>Manufacturer</span>
        </div>
        <nav style={styles.nav}>
          <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} Icon={Icons.Overview} label="Production Hub" />
          <NavItem active={activeTab === 'add-batch'} onClick={() => setActiveTab('add-batch')} Icon={Icons.Add} label="New Production" />
          <NavItem active={activeTab === 'my-dists'} onClick={() => setActiveTab('my-dists')} Icon={Icons.Distributors} label="Distributors" />
          <NavItem active={activeTab === 'transfer'} onClick={() => setActiveTab('transfer')} Icon={Icons.Transfer} label="Shipments" />
          <div style={styles.navDivider}>Alerts</div>
          <NavItem active={activeTab === 'recalled'} onClick={() => setActiveTab('recalled')} Icon={Icons.Alert} label="Recalled" count={stats.recalled} />
        </nav>
        <div style={styles.sidebarFooter}>
          <button onClick={handleLogout} style={styles.logoutBtn}><Icons.LogOut /> <span>Disconnect</span></button>
        </div>
      </div>

      <div style={{ ...styles.main, marginLeft: isMobile ? '0' : '280px' }}>
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isMobile && <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.iconBtn}><Icons.Menu /></button>}
            <h1 style={styles.headerTitle}>{activeTab.toUpperCase()}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {actionMsg && <div style={styles.toast}>{actionMsg}</div>}
            
            {/* Notifications Dropdown */}
            <div style={{ position: 'relative' }} ref={notificationsRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
                style={{ ...styles.iconBtn, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', cursor: 'pointer' }}
              >
                <Icons.Bell />
                {notifications.length > 0 && (
                  <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: '#ef4444', color: 'white', fontSize: '0.65rem', fontWeight: 'bold', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {notifications.length}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div style={{ position: 'absolute', right: 0, top: '45px', width: '320px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', border: '1px solid #e2e8f0', zIndex: 1000, padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>Notifications</span>
                    {notifications.length > 0 && <span style={{ fontSize: '0.75rem', background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>{notifications.length} Alert{notifications.length > 1 ? 's' : ''}</span>}
                  </div>
                  <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {notifications.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1.5rem', color: '#94a3b8', fontSize: '0.85rem' }}>No new notifications</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} style={{ padding: '0.75rem', borderRadius: '8px', background: n.type === 'expiry' ? '#fef2f2' : '#f0fdf4', borderLeft: `4px solid ${n.type === 'expiry' ? '#ef4444' : '#10b981'}` }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', color: n.type === 'expiry' ? '#991b1b' : '#065f46', marginBottom: '2px' }}>{n.title}</div>
                          <div style={{ fontSize: '0.75rem', color: '#475569', lineHeight: '1.3' }}>{n.text}</div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px', textAlign: 'right' }}>{n.date}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={styles.userProfile}>
               <div style={styles.avatar}>{account?.slice(2,4).toUpperCase()}</div>
               {!isMobile && <span style={styles.userName}>{entityName}</span>}
            </div>
          </div>
        </header>

        <div style={styles.content} className="animate-fade-in">
          {loading ? (
             <div style={styles.loadingContainer}>⌛ Syncing Production Records...</div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <>
                  <div style={styles.statsGrid}>
                    <StatCard title="Batches Produced" value={stats.total} Icon={Icons.Overview} color="#10b981" />
                    <StatCard title="Current Stock" value={stats.stock} Icon={Icons.Add} color="#3b82f6" />
                    <StatCard title="Expired Items" value={stats.expired} Icon={Icons.Alert} color="#f59e0b" />
                    <StatCard title="Recalled Batches" value={stats.recalled} Icon={Icons.Alert} color="#ef4444" />
                  </div>
                  <div className="glass-panel" style={{marginTop: '2rem'}}>
                    <h3 style={styles.panelTitle}>Recent Production</h3>
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead><tr style={styles.tableHeader}><th>Batch QR</th><th>Batch #</th><th>Product</th><th>Quantity</th><th>Status</th><th>Action</th></tr></thead>
                        <tbody>
                          {batches.map(b => (
                            <tr key={b.batchNumber} style={styles.tableRow}>
                              <td style={{padding: '10px'}}><QRCodeDisplay value={b.batchNumber} size={60} showActions={true} /></td>
                              <td style={{fontWeight: 700}}>{b.batchNumber}</td>
                              <td>{b.productName}</td>
                              <td>{b.quantity} units</td>
                              <td>
                                <span style={{...styles.badge, background: b.status === 0 ? '#f0fdf4' : '#fee2e2', color: b.status === 0 ? '#10b981' : '#ef4444'}}>
                                  {b.status === 0 ? 'ACTIVE' : b.status === 2 ? 'RECALLED' : 'EXPIRED'}
                                </span>
                              </td>
                              <td>
                                {b.status === 0 && <button onClick={() => openRecallModal(b.batchNumber)} className="btn btn-outline" style={{padding: '4px 12px', fontSize: '0.8rem', color: '#ef4444', borderColor: '#fee2e2'}}>Recall</button>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'add-batch' && (
                <div className="glass-panel" style={{maxWidth: '800px'}}>
                  <h3 style={styles.panelTitle}>Register New Batch</h3>
                  <form onSubmit={handleCreateBatch} style={styles.formGrid}>
                    <div style={styles.formGroup}><label style={styles.label}>Batch Number</label><input type="text" style={styles.input} value={newBatch.number} onChange={e => setNewBatch({...newBatch, number: e.target.value})} required /></div>
                    <div style={styles.formGroup}><label style={styles.label}>Product Name</label><input type="text" style={styles.input} value={newBatch.name} onChange={e => setNewBatch({...newBatch, name: e.target.value})} required /></div>
                    <div style={styles.formGroup}><label style={styles.label}>Generic Name</label><input type="text" style={styles.input} value={newBatch.generic} onChange={e => setNewBatch({...newBatch, generic: e.target.value})} required /></div>
                    <div style={styles.formGroup}><label style={styles.label}>Strength</label><input type="text" style={styles.input} value={newBatch.strength} onChange={e => setNewBatch({...newBatch, strength: e.target.value})} required /></div>
                    <div style={styles.formGroup}><label style={styles.label}>Mfg Date</label><input type="date" style={styles.input} value={newBatch.mfg} onChange={e => setNewBatch({...newBatch, mfg: e.target.value})} required /></div>
                    <div style={styles.formGroup}><label style={styles.label}>Expiry Date</label><input type="date" style={styles.input} value={newBatch.exp} onChange={e => setNewBatch({...newBatch, exp: e.target.value})} required /></div>
                    <div style={styles.formGroup}><label style={styles.label}>Quantity</label><input type="number" style={styles.input} value={newBatch.qty} onChange={e => setNewBatch({...newBatch, qty: e.target.value})} required /></div>
                    <div style={styles.formGroup}><label style={styles.label}>Unit Cost</label><input type="number" style={styles.input} value={newBatch.price} onChange={e => setNewBatch({...newBatch, price: e.target.value})} required /></div>
                    <button type="submit" className="btn btn-primary" style={{gridColumn: '1 / -1', marginTop: '1rem'}}>Initiate Ledger Entry</button>
                  </form>
                </div>
              )}

              {activeTab === 'my-dists' && (
                <div className="glass-panel">
                   <h3 style={styles.panelTitle}>Authorized Distributors</h3>
                   <div style={{display: 'flex', gap: '1rem', marginBottom: '2rem'}}>
                      <select style={styles.input} value={distToAdd} onChange={e => setDistToAdd(e.target.value)}>
                        <option value="">-- Select Distributor --</option>
                        {allDistributors.filter(d => !myDistributors.includes(d.address.toLowerCase())).map(d => (<option key={d.address} value={d.address}>{d.name}</option>))}
                      </select>
                      <button onClick={handleAddDistributor} className="btn btn-primary">Authorize</button>
                   </div>
                   <table style={styles.table}>
                      <thead>
                        <tr style={styles.tableHeader}>
                          <th>Name</th>
                          <th>Wallet Address</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allDistributors.filter(d => myDistributors.includes(d.address.toLowerCase())).map(d => (
                          <tr key={d.address} style={styles.tableRow}>
                            <td>{d.name}</td>
                            <td>{d.address}</td>
                            <td><span style={{...styles.badge, background: '#f0fdf4', color: '#10b981'}}>Authorized</span></td>
                            <td>
                              <button 
                                onClick={() => handleRemoveDistributor(d.address)} 
                                className="btn btn-outline" 
                                style={{padding: '4px 12px', fontSize: '0.8rem', color: '#ef4444', borderColor: '#fee2e2'}}
                              >
                                Unauthorize
                              </button>
                            </td>
                          </tr>
                        ))}
                        {allDistributors.filter(d => myDistributors.includes(d.address.toLowerCase())).length === 0 && (
                          <tr>
                            <td colSpan="4" style={{textAlign: 'center', padding: '2rem', color: '#94a3b8'}}>No distributors authorized yet.</td>
                          </tr>
                        )}
                      </tbody>
                   </table>
                </div>
              )}

              {activeTab === 'transfer' && (
                <div className="glass-panel" style={{maxWidth: '900px'}}>
                  <h3 style={styles.panelTitle}>Initiate Shipment Dispatch</h3>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem'}}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>1. Select Target Distributor</label>
                      <select style={styles.input} value={shipmentDistributor} onChange={e => setShipmentDistributor(e.target.value)}>
                        <option value="">-- Choose Recipient --</option>
                        {allDistributors.filter(d => myDistributors.includes(d.address.toLowerCase())).map(d => <option key={d.address} value={d.address}>{d.name}</option>)}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>2. Add Batches to Shipment</label>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <select style={styles.input} value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                          <option value="">-- Select Available Batch --</option>
                          {batches.filter(b => Number(b.quantity) > 0 && !shipmentItems.find(i => i.batchNumber === b.batchNumber)).map(b => <option key={b.batchNumber} value={b.batchNumber}>{b.productName} ({b.batchNumber})</option>)}
                        </select>
                        <button onClick={addBatchToShipment} className="btn btn-outline" style={{borderColor: '#10b981', color: '#10b981'}}>Add</button>
                      </div>
                    </div>
                  </div>

                  {shipmentItems.length > 0 && (
                    <div style={{marginBottom: '2rem'}}>
                      <h4 style={{fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem'}}>Shipment Manifest</h4>
                      <table style={styles.table}>
                        <thead><tr style={styles.tableHeader}><th>Batch</th><th>Quantity</th><th>Unit Price</th><th>Subtotal</th><th></th></tr></thead>
                        <tbody>
                          {shipmentItems.map(item => (
                            <tr key={item.batchNumber} style={styles.tableRow}>
                              <td><div style={{fontWeight: 700}}>{item.productName}</div><div style={{fontSize: '0.7rem'}}>{item.batchNumber}</div></td>
                              <td><input type="number" style={{...styles.input, padding: '4px 8px', width: '100px'}} placeholder="Qty" value={item.quantity} onChange={e => updateShipmentItem(item.batchNumber, 'quantity', e.target.value)} /></td>
                              <td><input type="number" style={{...styles.input, padding: '4px 8px', width: '100px'}} placeholder="Price" value={item.price} onChange={e => updateShipmentItem(item.batchNumber, 'price', e.target.value)} /></td>
                              <td>{Number(item.quantity || 0) * Number(item.price || 0)} {item.currency}</td>
                              <td><button onClick={() => removeBatchFromShipment(item.batchNumber)} style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer'}}><Icons.Trash /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={handleBulkTransfer} className="btn btn-primary" style={{marginTop: '2rem', width: '100%'}}>Commit Dispatch to Ledger</button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'invoice' && lastInvoice && (
                <div className="glass-panel">
                  <div ref={invoiceRef} style={{padding: '40px', background: 'white', border: '1px solid #e2e8f0'}}>
                     <div style={{textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #10b981', paddingBottom: '20px'}}>
                        <h2 style={{margin: 0, color: '#10b981'}}>SHIPMENT DELIVERY NOTE</h2>
                        <p style={{fontSize: '0.8rem', color: '#64748b'}}>MediTrace Verified Blockchain Shipment</p>
                     </div>
                     <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '40px', fontSize: '0.9rem'}}>
                        <div>
                           <strong>DISPATCHED BY:</strong><br/>{entityName}<br/><span style={{fontSize: '0.75rem', color: '#64748b'}}>{account}</span><br/><br/>
                           <strong>RECIPIENT DISTRIBUTOR:</strong><br/>{lastInvoice.distributor}<br/><span style={{fontSize: '0.75rem', color: '#64748b'}}>{lastInvoice.distributorAddr}</span>
                        </div>
                        <div style={{textAlign: 'right'}}><strong>DISPATCH DATE:</strong><br/>{lastInvoice.date}<br/><strong>INVOICE #:</strong> DISP-{Math.floor(Math.random()*100000)}</div>
                     </div>
                     <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '30px'}}>
                        <thead><tr style={{borderBottom: '2px solid #0f172a', textAlign: 'left', fontSize: '0.8rem'}}><th style={{padding: '10px'}}>Item Description</th><th>Batch #</th><th>Quantity</th><th>Unit Price</th><th style={{textAlign: 'right'}}>Subtotal</th></tr></thead>
                        <tbody>
                          {lastInvoice.items.map((item, idx) => (
                            <tr key={idx} style={{borderBottom: '1px solid #f1f5f9'}}><td style={{padding: '12px 10px'}}>{item.productName}</td><td>{item.batchNumber}</td><td>{item.quantity}</td><td>{item.price}</td><td style={{textAlign: 'right'}}>{item.total} {item.currency}</td></tr>
                          ))}
                        </tbody>
                     </table>
                     <div style={{textAlign: 'right', fontSize: '1.2rem', fontWeight: 800}}>GRAND TOTAL: {lastInvoice.grandTotal} {lastInvoice.currency}</div>
                     <div style={{marginTop: '60px', borderTop: '1px solid #e2e8f0', paddingTop: '20px', fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center'}}>
                        Blockchain Verified Transfer Requests have been initiated. Recipient must accept on-chain to finalize custody change.
                     </div>
                  </div>
                  <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
                    <button onClick={printInvoice} className="btn btn-primary">Print Invoice</button>
                    <button onClick={() => setActiveTab('transfer')} className="btn btn-outline">New Shipment</button>
                  </div>
                </div>
              )}

              {activeTab === 'recalled' && (
                <div className="glass-panel">
                  <h3 style={{...styles.panelTitle, color: '#ef4444'}}>Recalled Inventory</h3>
                  <table style={styles.table}>
                    <thead><tr style={styles.tableHeader}><th>Batch #</th><th>Product</th><th>Quantity</th></tr></thead>
                    <tbody>{batches.filter(b => b.isRecalled).map(b => (<tr key={b.batchNumber} style={styles.tableRow}><td>{b.batchNumber}</td><td>{b.productName}</td><td>{b.quantity}</td></tr>))}</tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
        <footer style={styles.dashboardFooter}>
          <p style={styles.footerText}>© 2026 MediTrace Blockchain. Developed at UET Taxila.</p>
          <p style={styles.footerStatus}>Network: <span style={{color: '#10b981', fontWeight: 700}}>Operational</span></p>
        </footer>
      </div>
    </div>
  );
}

const NavItem = ({ active, onClick, Icon, label, count }) => (
  <div onClick={onClick} style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}><Icon /><span style={{ marginLeft: '12px', flex: 1 }}>{label}</span>{count > 0 && <span style={styles.navCount}>{count}</span>}</div>
);

const StatCard = ({ title, value, Icon, color }) => (
  <div style={{ ...styles.statCard, borderTop: `4px solid ${color}` }}><div style={{ ...styles.statIconContainer, color: color, background: `${color}10` }}><Icon /></div><div><div style={styles.statTitle}>{title}</div><div style={styles.statValue}>{value}</div></div></div>
);

const styles = {
  dashboardWrapper: { display: 'flex', minHeight: '100vh', background: '#f8fafc', position: 'fixed', inset: 0, zIndex: 10 },
  sidebar: { position: 'fixed', top: 0, bottom: 0, width: '280px', background: '#0f172a', display: 'flex', flexDirection: 'column', zIndex: 100 },
  sidebarOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 },
  sidebarBrand: { padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column' },
  roleTag: { color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' },
  nav: { flex: 1, padding: '0 1rem' },
  navItem: { display: 'flex', alignItems: 'center', padding: '0.8rem 1rem', borderRadius: '8px', cursor: 'pointer', color: '#94a3b8', marginBottom: '4px' },
  navItemActive: { background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
  navCount: { background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px', fontWeight: 700 },
  navDivider: { padding: '1rem', fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' },
  sidebarFooter: { padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' },
  logoutBtn: { width: '100%', padding: '0.6rem', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  main: { flex: 1, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
  header: { height: '70px', background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 },
  headerTitle: { fontSize: '1rem', fontWeight: 800, color: '#0f172a' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  toast: { background: '#f0fdf4', color: '#059669', padding: '4px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600 },
  userProfile: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  userName: { color: '#0f172a', fontWeight: 600, fontSize: '0.9rem' },
  content: { padding: '2rem', flex: 1 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' },
  statCard: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', gap: '1rem', alignItems: 'center' },
  statIconContainer: { width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statTitle: { color: '#64748b', fontSize: '0.8rem' },
  statValue: { fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' },
  panelTitle: { fontSize: '1.2rem', color: '#0f172a', marginBottom: '1.5rem' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { background: '#f8fafc', textAlign: 'left', color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase' },
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  badge: { padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  formStack: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.8rem', fontWeight: 700, color: '#475569' },
  input: { padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' },
  loadingContainer: { textAlign: 'center', padding: '5rem', color: '#64748b' },
  dashboardFooter: {
    padding: '1.5rem 2.5rem',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'white',
    marginTop: 'auto'
  },
  footerText: { margin: 0, color: '#94a3b8', fontSize: '0.8rem' },
  footerStatus: { margin: 0, color: '#64748b', fontSize: '0.8rem' }
};
