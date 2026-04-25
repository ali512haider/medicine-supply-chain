import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useNavigate } from 'react-router-dom';

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
  )
};

export default function ManufacturerDashboard() {
  const { contracts, account, disconnectWallet } = useWeb3();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Data State
  const [batches, setBatches] = useState([]);
  const [allDistributors, setAllDistributors] = useState([]);
  const [myDistributors, setMyDistributors] = useState([]);
  const [stats, setStats] = useState({ total: 0, stock: 0, expired: 0, recalled: 0 });
  const [actionMsg, setActionMsg] = useState('');

  // Form States
  const [newBatch, setNewBatch] = useState({ number: '', name: '', generic: '', mfg: '', exp: '', qty: '', price: '', currency: 'PKR', type: 'Tablet' });
  const [transferData, setTransferData] = useState({ batchNumber: '', distributor: '', quantity: '' });
  const [distToAdd, setDistToAdd] = useState('');

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = useCallback(async () => {
    if (!contracts.product || !account) return;
    setLoading(true);
    try {
      // 1. Fetch All Batches by this Manufacturer
      const bIds = await contracts.product.getManufacturerBatches(account);
      const bList = [];
      let totalQty = 0, expiredCount = 0, recalledCount = 0;

      for (let id of bIds) {
        const b = await contracts.product.getBatch(id);
        const s = await contracts.product.getBatchStatus(id);
        const qty = await contracts.product.getStockOf(id, account);
        
        const isExpired = Number(b.expiryDate) * 1000 < Date.now();
        const isRecalled = Number(s) === 1;

        bList.push({
          batchNumber: b.batchNumber,
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
      setStats({ total: bIds.length, stock: totalQty, expired: expiredCount, recalled: recalledCount });

      // 2. Fetch All Approved Distributors
      const allAddrs = await contracts.registry.getAllRegistered();
      const dists = [];
      for (let addr of allAddrs) {
        const entity = await contracts.registry.getEntity(addr);
        if (Number(entity.role) === 3 && Number(entity.status) === 2) {
          dists.push({ address: addr, name: entity.name });
        }
      }
      setAllDistributors(dists);

      // 3. My Whitelisted Distributors
      const myDists = await contracts.transfer.getDistributors(account);
      setMyDistributors(myDists.map(d => d.toLowerCase()));

    } catch (err) {
      console.error(err);
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
        newBatch.number, newBatch.name, newBatch.generic,
        mfgTs, expTs, qty, price, newBatch.currency, newBatch.type,
        [], [], [] // No raw materials for now
      );
      await tx.wait();
      setActionMsg('✅ Batch Created!');
      setNewBatch({ number: '', name: '', generic: '', mfg: '', exp: '', qty: '', price: '', currency: 'PKR', type: 'Tablet' });
      fetchData();
    } catch (err) { setActionMsg('❌ Error: ' + (err.reason || 'Failed')); }
  };

  const handleAddDistributor = async () => {
    if (!distToAdd) return;
    try {
      setActionMsg('⏳ Authorizing...');
      const tx = await contracts.transfer.addDistributor(distToAdd);
      await tx.wait();
      setActionMsg('✅ Distributor Added!');
      setDistToAdd('');
      fetchData();
    } catch (err) { setActionMsg('❌ Auth Failed'); }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      setActionMsg('⏳ Shipping...');
      const batch = batches.find(b => b.batchNumber === transferData.batchNumber);
      const qty = window.BigInt(transferData.quantity);
      const price = window.BigInt(batch.price);

      const tx = await contracts.transfer.requestTransfer(
        0, // Direction 0 = MFR_TO_DIST
        transferData.batchNumber,
        transferData.distributor,
        qty,
        price,
        batch.currency,
        "Shipment from Manufacturer"
      );
      await tx.wait();
      setActionMsg('✅ Transfer Requested!');
      setTransferData({ batchNumber: '', distributor: '', quantity: '' });
      fetchData();
    } catch (err) { setActionMsg('❌ ' + (err.reason || 'Failed')); }
  };

  const handleRecall = async (batchNo) => {
    if (!window.confirm(`Recall batch ${batchNo}?`)) return;
    try {
       setActionMsg('⏳ Recalling...');
       const tx = await contracts.product.recallBatch(batchNo);
       await tx.wait();
       setActionMsg('✅ Batch Recalled');
       fetchData();
    } catch (err) { setActionMsg('❌ Recall Failed'); }
  };

  return (
    <div style={styles.dashboardWrapper}>
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && <div style={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar Navigation */}
      <div style={{ ...styles.sidebar, left: sidebarOpen ? '0' : '-280px' }}>
        <div style={styles.sidebarBrand}>
          <span style={{ color: 'var(--accent-primary)' }}>MediChain</span>
          <span style={styles.roleTag}>Manufacturer</span>
        </div>
        <nav style={styles.nav}>
          <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} Icon={Icons.Overview} label="Command Center" />
          <NavItem active={activeTab === 'add-batch'} onClick={() => setActiveTab('add-batch')} Icon={Icons.Add} label="New Production" />
          <NavItem active={activeTab === 'my-dists'} onClick={() => setActiveTab('my-dists')} Icon={Icons.Distributors} label="My Distributors" />
          <NavItem active={activeTab === 'transfer'} onClick={() => setActiveTab('transfer')} Icon={Icons.Transfer} label="Ship Products" />
          <div style={styles.navDivider}>Monitoring</div>
          <NavItem active={activeTab === 'recalled'} onClick={() => setActiveTab('recalled')} Icon={Icons.Alert} label="Recalled Batches" count={stats.recalled} />
          <NavItem active={activeTab === 'expired'} onClick={() => setActiveTab('expired')} Icon={Icons.Alert} label="Expired Batches" count={stats.expired} />
        </nav>
        <div style={styles.sidebarFooter}>
          <button onClick={disconnectWallet} style={styles.logoutBtn}>
            <Icons.LogOut /> <span>Disconnect</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ ...styles.main, marginLeft: isMobile ? '0' : '280px' }}>
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isMobile && <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.iconBtn}><Icons.Menu /></button>}
            <h1 style={styles.headerTitle}>{activeTab.replace('-', ' ').toUpperCase()}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {actionMsg && <div style={styles.toast}>{actionMsg}</div>}
            <div style={styles.userProfile}>
               <div style={styles.avatar}>{account?.slice(2,4).toUpperCase()}</div>
               {!isMobile && <span style={styles.userName}>Manufacturer Node</span>}
            </div>
          </div>
        </header>

        <div style={styles.content} className="animate-fade-in">
          {loading ? (
             <div style={styles.loadingContainer}>⌛ Syncing with Blockchain...</div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <>
                  <div style={styles.statsGrid}>
                    <StatCard title="Active Batches" value={stats.total} Icon={Icons.Overview} color="#10b981" />
                    <StatCard title="Current Stock" value={stats.stock} Icon={Icons.Transfer} color="#3b82f6" />
                    <StatCard title="Recalled" value={stats.recalled} Icon={Icons.Alert} color="#ef4444" />
                    <StatCard title="Expired" value={stats.expired} Icon={Icons.Alert} color="#f59e0b" />
                  </div>

                  <div className="glass-panel" style={{ marginTop: '2.5rem' }}>
                    <h3 style={styles.panelTitle}>Recent Production History</h3>
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead><tr style={styles.tableHeader}><th>Batch #</th><th>Product</th><th>Quantity</th><th>Price</th><th>Expiry</th><th>Status</th><th>Actions</th></tr></thead>
                        <tbody>
                          {batches.map(b => (
                            <tr key={b.batchNumber} style={styles.tableRow}>
                              <td style={{fontWeight: 700}}>{b.batchNumber}</td>
                              <td>{b.productName}</td>
                              <td>{b.quantity}</td>
                              <td>{b.price} {b.currency}</td>
                              <td style={{color: b.isExpired ? '#ef4444' : '#64748b'}}>{new Date(b.expiryDate*1000).toLocaleDateString()}</td>
                              <td>
                                <span style={{...styles.badge, background: b.isRecalled ? '#fee2e2' : '#f0fdf4', color: b.isRecalled ? '#ef4444' : '#10b981'}}>
                                  {b.isRecalled ? 'RECALLED' : 'ACTIVE'}
                                </span>
                              </td>
                              <td>
                                {!b.isRecalled && <button onClick={() => handleRecall(b.batchNumber)} style={styles.rowBtnRecall}>Recall</button>}
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
                  <h3 style={styles.panelTitle}>Register New Production Batch</h3>
                  <form onSubmit={handleCreateBatch} style={styles.formGrid}>
                    <FormGroup label="Batch ID" value={newBatch.number} onChange={v => setNewBatch({...newBatch, number: v})} placeholder="MFR-2024-001" required />
                    <FormGroup label="Medicine Name" value={newBatch.name} onChange={v => setNewBatch({...newBatch, name: v})} placeholder="Panadol 500mg" required />
                    <FormGroup label="Generic Name" value={newBatch.generic} onChange={v => setNewBatch({...newBatch, generic: v})} placeholder="Paracetamol" required />
                    <FormGroup label="Dosage Form" type="select" options={['Tablet', 'Capsule', 'Syrup', 'Injection']} value={newBatch.type} onChange={v => setNewBatch({...newBatch, type: v})} />
                    <FormGroup label="Manufacturing Date" type="date" value={newBatch.mfg} onChange={v => setNewBatch({...newBatch, mfg: v})} required />
                    <FormGroup label="Expiry Date" type="date" value={newBatch.exp} onChange={v => setNewBatch({...newBatch, exp: v})} required />
                    <FormGroup label="Batch Quantity" type="number" value={newBatch.qty} onChange={v => setNewBatch({...newBatch, qty: v})} placeholder="1000" required />
                    <FormGroup label="Cost Per Unit" type="number" value={newBatch.price} onChange={v => setNewBatch({...newBatch, price: v})} placeholder="50" required />
                    <div style={{gridColumn: '1 / -1'}}><button type="submit" className="btn btn-primary" style={{width: '100%', padding: '1rem'}}>Register Batch on Ledger</button></div>
                  </form>
                </div>
              )}

              {activeTab === 'my-dists' && (
                <div className="glass-panel">
                   <h3 style={styles.panelTitle}>Authorized Distributor Network</h3>
                   <div style={{display: 'flex', gap: '1rem', marginBottom: '2.5rem'}}>
                      <select style={styles.input} value={distToAdd} onChange={e => setDistToAdd(e.target.value)}>
                         <option value="">-- Choose Globally Approved Distributor --</option>
                         {allDistributors.filter(d => !myDistributors.includes(d.address.toLowerCase())).map(d => (
                            <option key={d.address} value={d.address}>{d.name} ({d.address.slice(0,12)}...)</option>
                         ))}
                      </select>
                      <button onClick={handleAddDistributor} className="btn btn-primary" style={{whiteSpace: 'nowrap'}}>Add to Network</button>
                   </div>
                   <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                         <thead><tr style={styles.tableHeader}><th>Distributor Name</th><th>Wallet Address</th><th>Status</th></tr></thead>
                         <tbody>
                            {allDistributors.filter(d => myDistributors.includes(d.address.toLowerCase())).map(d => (
                               <tr key={d.address} style={styles.tableRow}>
                                  <td style={{fontWeight: 700}}>{d.name}</td>
                                  <td style={{fontFamily: 'monospace'}}>{d.address}</td>
                                  <td><span style={{...styles.badge, background: '#f0fdf4', color: '#10b981'}}>AUTHORIZED</span></td>
                               </tr>
                            ))}
                         </tbody>
                      </table>
                   </div>
                </div>
              )}

              {activeTab === 'transfer' && (
                <div className="glass-panel" style={{maxWidth: '600px'}}>
                  <h3 style={styles.panelTitle}>Dispatch Shipment</h3>
                  <form onSubmit={handleTransfer} style={styles.formStack}>
                    <div style={styles.formGroup}>
                       <label style={styles.label}>Select Product Batch</label>
                       <select style={styles.input} value={transferData.batchNumber} onChange={e => setTransferData({...transferData, batchNumber: e.target.value})} required>
                          <option value="">-- Choose Batch --</option>
                          {batches.filter(b => Number(b.quantity) > 0 && !b.isRecalled).map(b => (
                             <option key={b.batchNumber} value={b.batchNumber}>{b.productName} ({b.quantity} units avail)</option>
                          ))}
                       </select>
                    </div>
                    <div style={styles.formGroup}>
                       <label style={styles.label}>Receiver Distributor</label>
                       <select style={styles.input} value={transferData.distributor} onChange={e => setTransferData({...transferData, distributor: e.target.value})} required>
                          <option value="">-- Choose Authorized Distributor --</option>
                          {allDistributors.filter(d => myDistributors.includes(d.address.toLowerCase())).map(d => (
                             <option key={d.address} value={d.address}>{d.name}</option>
                          ))}
                       </select>
                    </div>
                    <div style={styles.formGroup}>
                       <label style={styles.label}>Quantity to Ship</label>
                       <input type="number" style={styles.input} value={transferData.quantity} onChange={e => setTransferData({...transferData, quantity: e.target.value})} required />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}}>Initialize Transfer</button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const NavItem = ({ active, onClick, Icon, label, count }) => (
  <div onClick={onClick} style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}>
    <Icon /> <span style={{ marginLeft: '12px', flex: 1 }}>{label}</span>
    {count > 0 && <span style={styles.navCount}>{count}</span>}
  </div>
);

const StatCard = ({ title, value, Icon, color }) => (
  <div style={{ ...styles.statCard, borderTop: `4px solid ${color}` }}>
    <div style={{ ...styles.statIconContainer, color: color, background: `${color}10` }}><Icon /></div>
    <div><div style={styles.statTitle}>{title}</div><div style={styles.statValue}>{value}</div></div>
  </div>
);

const FormGroup = ({ label, value, onChange, type = 'text', options = [], placeholder, required = false }) => (
  <div style={styles.formGroup}>
    <label style={styles.label}>{label}</label>
    {type === 'select' ? (
      <select style={styles.input} value={value} onChange={e => onChange(e.target.value)} required={required}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    ) : (
      <input type={type} style={styles.input} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} required={required} />
    )}
  </div>
);

const styles = {
  dashboardWrapper: { display: 'flex', minHeight: '100vh', background: '#f8fafc', position: 'fixed', inset: 0, zIndex: 10 },
  sidebar: { position: 'fixed', top: 0, bottom: 0, width: '280px', background: '#0f172a', display: 'flex', flexDirection: 'column', zIndex: 100, transition: 'left 0.3s ease' },
  sidebarOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 },
  sidebarBrand: { padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '4px' },
  roleTag: { color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' },
  nav: { flex: 1, padding: '0 1rem' },
  navItem: { display: 'flex', alignItems: 'center', padding: '0.875rem 1.25rem', borderRadius: '10px', cursor: 'pointer', color: '#94a3b8', transition: 'all 0.2s ease', marginBottom: '4px' },
  navItemActive: { background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
  navCount: { background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px', fontWeight: 700 },
  navDivider: { padding: '1.5rem 1.25rem 0.75rem', fontSize: '0.7rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' },
  sidebarFooter: { padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' },
  logoutBtn: { width: '100%', padding: '0.75rem', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', fontSize: '0.9rem' },
  main: { flex: 1, height: '100vh', overflowY: 'auto' },
  header: { height: '80px', background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 },
  headerTitle: { fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
  toast: { background: '#f0fdf4', color: '#059669', padding: '0.5rem 1.25rem', borderRadius: '99px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid #d1fae5' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', background: '#10b981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  userName: { color: '#0f172a', fontWeight: 600, fontSize: '0.95rem' },
  content: { padding: '2.5rem' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' },
  statCard: { background: 'white', padding: '1.5rem', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', gap: '1.25rem', alignItems: 'center' },
  statIconContainer: { width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statTitle: { color: '#64748b', fontSize: '0.85rem', fontWeight: 500 },
  statValue: { fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' },
  panelTitle: { fontSize: '1.25rem', color: '#0f172a', marginBottom: '2rem', marginTop: 0 },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { background: '#f8fafc', textAlign: 'left', color: '#64748b', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tableRow: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s ease' },
  badge: { padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', '@media (max-width: 640px)': { gridTemplateColumns: '1fr' } },
  formStack: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.85rem', fontWeight: 700, color: '#475569' },
  input: { padding: '0.875rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: '0.95rem' },
  rowBtnRecall: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' },
  loadingContainer: { textAlign: 'center', padding: '5rem', color: '#64748b', fontSize: '1.1rem' }
};
