import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useNavigate } from 'react-router-dom';

const ROLE_NAMES = { 1: 'Admin', 2: 'Manufacturer', 3: 'Distributor', 4: 'Supplier', 5: 'Pharmacist' };

// --- Professional SVG Icons ---
const Icons = {
  Overview: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
  ),
  Create: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
  ),
  Transfer: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 3 4 4-4 4"></path><path d="M20 7H4"></path><path d="m8 21-4-4 4-4"></path><path d="M4 17h16"></path></svg>
  ),
  Alert: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
  ),
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
  ),
  Distributor: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
  ),
  QR: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><path d="M7 7h.01M17 7h.01M7 17h.01"></path></svg>
  ),
  UserPlus: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
  )
};

export default function ManufacturerDashboard() {
  const { contracts, account } = useWeb3();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Data State
  const [batches, setBatches] = useState([]);
  const [allDistributors, setAllDistributors] = useState([]);
  const [myWhitelistedDists, setMyWhitelistedDists] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, recalled: 0 });
  const [actionMsg, setActionMsg] = useState('');

  // Form States
  const [newBatch, setNewBatch] = useState({
    batchNumber: '', productName: '', genericName: '', dosageForm: 'Tablet',
    strength: '', manufacturerName: '', costPerUnit: '', currency: 'PKR', mfgDate: '', expiryDate: '', totalQuantity: ''
  });
  const [transferData, setTransferData] = useState({ batchNumber: '', distributor: '', quantity: '', price: '0' });
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
      // 1. Fetch Batches
      const batchIds = await contracts.product.getBatchesByManufacturer(account);
      const batchList = [];
      let active = 0, expired = 0, recalled = 0;
      const now = Math.floor(Date.now() / 1000);

      for (let id of batchIds) {
        const b = await contracts.product.getBatch(id);
        const s = await contracts.product.getBatchStatus(id);
        const status = Number(s);
        
        const bObj = {
          batchNumber: b.batchNumber,
          productName: b.productName,
          genericName: b.genericName,
          dosageForm: b.dosageForm,
          strength: b.strength,
          manufacturer: b.manufacturer,
          costPerUnit: b.costPerUnit.toString(),
          currency: b.currency,
          mfgDate: Number(b.mfgDate),
          expiryDate: Number(b.expiryDate),
          status: status,
          totalQuantity: b.totalQuantity.toString(),
          remaining: b.remainingAtSource.toString(),
          recallReason: b.recallReason
        };
        batchList.push(bObj);

        if (status === 0) active++;
        else if (status === 1 || bObj.expiryDate < now) expired++;
        else if (status === 2) recalled++;
      }
      setBatches(batchList);
      setStats({ total: batchList.length, active, expired, recalled });

      // 2. Fetch All Approved Distributors (Global)
      const allAddrs = await contracts.registry.getAllRegistered();
      const dists = [];
      for (let addr of allAddrs) {
        const entity = await contracts.registry.getEntity(addr);
        if (Number(entity.role) === 3 && Number(entity.status) === 2) {
          dists.push({ address: addr, name: entity.name });
        }
      }
      setAllDistributors(dists);

      // 3. Fetch My Whitelisted Distributors
      const myDists = await contracts.transfer.getDistributors(account);
      setMyWhitelistedDists(myDists.map(addr => addr.toLowerCase()));

    } catch (err) {
      console.error(err);
      setActionMsg('❌ Error loading data');
    } finally {
      setLoading(false);
    }
  }, [contracts.product, contracts.registry, contracts.transfer, account]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddBatch = async (e) => {
    e.preventDefault();
    try {
      setActionMsg('⏳ Creating Batch...');
      const mfgUnix = Math.floor(new Date(newBatch.mfgDate).getTime() / 1000);
      const expUnix = Math.floor(new Date(newBatch.expiryDate).getTime() / 1000);
      const qty = window.BigInt(newBatch.totalQuantity || 0);
      const cost = window.BigInt(newBatch.costPerUnit || 0);

      const tx = await contracts.product.addBatch(
        newBatch.batchNumber, newBatch.productName, newBatch.genericName,
        newBatch.dosageForm, newBatch.strength, newBatch.manufacturerName,
        [], [], [],
        cost, newBatch.currency,
        mfgUnix, expUnix, qty,
        "", ""
      );
      await tx.wait();
      setActionMsg('✅ Batch Created!');
      setNewBatch({
        batchNumber: '', productName: '', genericName: '', dosageForm: 'Tablet',
        strength: '', manufacturerName: '', costPerUnit: '', currency: 'PKR', mfgDate: '', expiryDate: '', totalQuantity: ''
      });
      fetchData();
      setActiveTab('overview');
    } catch (err) { 
      console.error(err);
      setActionMsg('❌ ' + (err.reason || err.message)); 
    }
  };

  const handleAddDistributor = async () => {
    if (!distToAdd) return;
    try {
      setActionMsg('⏳ Adding Distributor...');
      const tx = await contracts.transfer.addDistributor(distToAdd);
      await tx.wait();
      setActionMsg('✅ Distributor Added!');
      setDistToAdd('');
      fetchData();
    } catch (err) { 
      console.error(err);
      setActionMsg('❌ Failed to add distributor'); 
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      setActionMsg('⏳ Initiating Transfer...');
      const qty = window.BigInt(transferData.quantity || 0);
      const price = window.BigInt(transferData.price || 0);
      
      // Using requestTransfer (direction 0 = MFR_TO_DIST)
      const tx = await contracts.transfer.requestTransfer(
        0, 
        transferData.batchNumber,
        transferData.distributor,
        qty,
        price,
        "PKR",
        `Shipment from manufacturer ${account.slice(0,6)}`
      );
      await tx.wait();
      setActionMsg('✅ Transfer Requested!');
      setTransferData({ batchNumber: '', distributor: '', quantity: '', price: '0' });
      fetchData();
    } catch (err) { 
      console.error(err);
      setActionMsg('❌ ' + (err.reason || err.message)); 
    }
  };

  const getQRUrl = (batchId) => {
    const baseUrl = window.location.origin + "/verify?batch=" + batchId;
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(baseUrl)}`;
  };

  return (
    <div style={styles.dashboardWrapper}>
      {isMobile && sidebarOpen && <div style={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

      <div style={{ ...styles.sidebar, left: sidebarOpen ? '0' : '-280px' }}>
        <div style={styles.sidebarBrand}><span style={{ color: '#10b981' }}>MediChain</span> Mfr</div>
        <nav style={styles.nav}>
          <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} Icon={Icons.Overview} label="Overview" />
          <NavItem active={activeTab === 'create'} onClick={() => setActiveTab('create')} Icon={Icons.Create} label="Create Batch" />
          <NavItem active={activeTab === 'distributors'} onClick={() => setActiveTab('distributors')} Icon={Icons.UserPlus} label="My Distributors" />
          <NavItem active={activeTab === 'transfer'} onClick={() => setActiveTab('transfer')} Icon={Icons.Transfer} label="Ship Products" />
          <div style={styles.navDivider}>Inventory Control</div>
          <NavItem active={activeTab === 'expired'} onClick={() => setActiveTab('expired')} Icon={Icons.Alert} label="Expired" count={stats.expired} />
          <NavItem active={activeTab === 'recalled'} onClick={() => setActiveTab('recalled')} Icon={Icons.Alert} label="Recalled" count={stats.recalled} />
        </nav>
      </div>

      <div style={{ ...styles.main, marginLeft: isMobile ? '0' : '280px' }}>
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isMobile && <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.iconBtn}><Icons.Menu /></button>}
            <h1 style={styles.headerTitle}>{activeTab.replace('-', ' ').toUpperCase()}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {actionMsg && <div style={styles.toast}>{actionMsg}</div>}
            <div style={styles.userProfile}>
              <div style={styles.avatar}>{account?.slice(2, 4).toUpperCase()}</div>
              {!isMobile && <span style={styles.userName}>Manufacturer</span>}
            </div>
          </div>
        </header>

        <div style={styles.content}>
          {loading ? (
             <div style={styles.loadingContainer}>⌛ Syncing...</div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <>
                  <div style={styles.grid}>
                    <StatCard title="Total Batches" value={stats.total} Icon={Icons.Overview} color="#10b981" />
                    <StatCard title="Active Stock" value={stats.active} Icon={Icons.Overview} color="#3b82f6" />
                    <StatCard title="Expired" value={stats.expired} Icon={Icons.Alert} color="#f59e0b" />
                    <StatCard title="Recalled" value={stats.recalled} Icon={Icons.Alert} color="#ef4444" />
                  </div>
                  <div style={styles.lightPanel}>
                    <h3 style={styles.panelTitle}>Production Log</h3>
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead style={styles.tableHeader}>
                          <tr><th>Batch #</th><th>Product</th><th>Remaining</th><th>Expiry</th><th>QR</th></tr>
                        </thead>
                        <tbody>
                          {batches.map(b => (
                            <tr key={b.batchNumber} style={styles.tableRow}>
                              <td style={{fontWeight: 600}}>{b.batchNumber}</td>
                              <td>{b.productName}</td>
                              <td>{b.remaining}</td>
                              <td>{new Date(b.expiryDate*1000).toLocaleDateString()}</td>
                              <td><button style={styles.iconBtn} onClick={() => window.open(getQRUrl(b.batchNumber))}><Icons.QR /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'distributors' && (
                <div style={styles.lightPanel}>
                  <h3 style={styles.panelTitle}>My Delivery Network</h3>
                  <p style={{color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem'}}>Authorize distributors to allow stock transfers to them.</p>
                  
                  <div style={{display: 'flex', gap: '1rem', marginBottom: '2rem'}}>
                    <select style={{...styles.input, flex: 1}} value={distToAdd} onChange={e => setDistToAdd(e.target.value)}>
                      <option value="">-- Choose Distributor to Authorize --</option>
                      {allDistributors.filter(d => !myWhitelistedDists.includes(d.address.toLowerCase())).map(d => (
                        <option key={d.address} value={d.address}>{d.name} ({d.address.slice(0,12)}...)</option>
                      ))}
                    </select>
                    <button onClick={handleAddDistributor} style={{...styles.submitBtn, marginTop: 0, padding: '0 2rem'}}>Add to Network</button>
                  </div>

                  <h4 style={{fontSize: '0.9rem', color: '#1e293b', marginBottom: '1rem'}}>Authorized Distributors</h4>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead style={styles.tableHeader}><tr><th>Name</th><th>Address</th><th>Status</th></tr></thead>
                      <tbody>
                        {allDistributors.filter(d => myWhitelistedDists.includes(d.address.toLowerCase())).map(d => (
                          <tr key={d.address} style={styles.tableRow}>
                            <td style={{fontWeight: 600}}>{d.name}</td>
                            <td style={{fontSize: '0.8rem'}}>{d.address}</td>
                            <td><span style={{...styles.badge, background: '#f0fdf4', color: '#10b981'}}>AUTHORIZED</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'create' && (
                <div style={styles.lightPanel}>
                  <h3 style={styles.panelTitle}>Create Batch</h3>
                  <form onSubmit={handleAddBatch} style={styles.formGrid}>
                    <div style={styles.formGroup}><label style={styles.label}>Batch #</label><input style={styles.input} value={newBatch.batchNumber} onChange={e => setNewBatch({...newBatch, batchNumber: e.target.value})} required/></div>
                    <div style={styles.formGroup}><label style={styles.label}>Product Name</label><input style={styles.input} value={newBatch.productName} onChange={e => setNewBatch({...newBatch, productName: e.target.value})} required/></div>
                    <div style={styles.formGroup}><label style={styles.label}>Dosage Form</label><select style={styles.input} value={newBatch.dosageForm} onChange={e => setNewBatch({...newBatch, dosageForm: e.target.value})}>{['Tablet','Syrup','Injection','Cream'].map(f=><option key={f} value={f}>{f}</option>)}</select></div>
                    <div style={styles.formGroup}><label style={styles.label}>Strength</label><input style={styles.input} value={newBatch.strength} onChange={e => setNewBatch({...newBatch, strength: e.target.value})} required/></div>
                    <div style={styles.formGroup}><label style={styles.label}>Qty</label><input style={styles.input} type="number" value={newBatch.totalQuantity} onChange={e => setNewBatch({...newBatch, totalQuantity: e.target.value})} required/></div>
                    <div style={styles.formGroup}><label style={styles.label}>Cost</label><input style={styles.input} type="number" value={newBatch.costPerUnit} onChange={e => setNewBatch({...newBatch, costPerUnit: e.target.value})} required/></div>
                    <div style={styles.formGroup}><label style={styles.label}>Mfg Date</label><input style={styles.input} type="date" value={newBatch.mfgDate} onChange={e => setNewBatch({...newBatch, mfgDate: e.target.value})} required/></div>
                    <div style={styles.formGroup}><label style={styles.label}>Expiry Date</label><input style={styles.input} type="date" value={newBatch.expiryDate} onChange={e => setNewBatch({...newBatch, expiryDate: e.target.value})} required/></div>
                    <button type="submit" style={styles.submitBtn}>Generate Batch</button>
                  </form>
                </div>
              )}

              {activeTab === 'transfer' && (
                <div style={styles.lightPanel}>
                  <h3 style={styles.panelTitle}>Ship Stock</h3>
                  <form onSubmit={handleTransfer} style={styles.formStack}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Select Batch</label>
                      <select style={styles.input} value={transferData.batchNumber} onChange={e => setTransferData({...transferData, batchNumber: e.target.value})} required>
                        <option value="">-- Choose Batch --</option>
                        {batches.filter(b => Number(b.remaining) > 0 && b.status === 0).map(b => (
                          <option key={b.batchNumber} value={b.batchNumber}>{b.productName} ({b.remaining} units)</option>
                        ))}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Select Authorized Distributor</label>
                      <select style={styles.input} value={transferData.distributor} onChange={e => setTransferData({...transferData, distributor: e.target.value})} required>
                        <option value="">-- Choose from Authorized Network --</option>
                        {allDistributors.filter(d => myWhitelistedDists.includes(d.address.toLowerCase())).map(d => (
                          <option key={d.address} value={d.address}>{d.name} ({d.address.slice(0,10)}...)</option>
                        ))}
                      </select>
                    </div>
                    <div style={styles.formGroup}><label style={styles.label}>Quantity</label><input style={styles.input} type="number" value={transferData.quantity} onChange={e => setTransferData({...transferData, quantity: e.target.value})} required/></div>
                    <button type="submit" style={styles.submitBtn}>Send Transfer Request</button>
                  </form>
                </div>
              )}

              {(activeTab === 'expired' || activeTab === 'recalled') && (
                <div style={styles.lightPanel}>
                  <h3 style={{...styles.panelTitle, color: activeTab === 'recalled' ? '#ef4444' : '#f59e0b'}}>{activeTab.toUpperCase()}</h3>
                  <table style={styles.table}>
                    <thead style={styles.tableHeader}><tr><th>Batch #</th><th>Product</th><th>Stock</th></tr></thead>
                    <tbody>
                      {batches.filter(b => activeTab === 'recalled' ? b.status === 2 : b.status === 1).map(b => (
                        <tr key={b.batchNumber} style={styles.tableRow}><td>{b.batchNumber}</td><td>{b.productName}</td><td>{b.remaining}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ title, value, Icon, color }) => (
  <div style={{ ...styles.statCard, borderTop: `4px solid ${color}` }}>
    <div style={{ ...styles.statIconContainer, color: color, background: `${color}15` }}><Icon /></div>
    <div style={styles.statInfo}><div style={styles.statTitle}>{title}</div><div style={styles.statValue}>{value}</div></div>
  </div>
);

const NavItem = ({ active, onClick, Icon, label, count }) => (
  <div onClick={onClick} style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}><Icon /><span style={{ marginLeft: '12px', flex: 1 }}>{label}</span>{count > 0 && <span style={styles.navCount}>{count}</span>}</div>
);

const styles = {
  dashboardWrapper: { display: 'flex', minHeight: '100vh', background: '#f1f5f9', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 2000, overflow: 'hidden' },
  sidebar: { position: 'fixed', top: 0, bottom: 0, width: '280px', background: '#ffffff', borderRight: '1px solid #e2e8f0', zIndex: 100, display: 'flex', flexDirection: 'column', padding: '1.5rem 0' },
  sidebarOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 90 },
  sidebarBrand: { fontSize: '1.5rem', fontWeight: 800, padding: '0 1.5rem 2rem', color: '#1e293b' },
  nav: { padding: '0 0.75rem' },
  navItem: { display: 'flex', alignItems: 'center', padding: '0.875rem 1rem', borderRadius: '8px', cursor: 'pointer', color: '#64748b', fontWeight: 500, marginBottom: '4px' },
  navItemActive: { background: '#f1f5f9', color: '#10b981' },
  navCount: { background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px' },
  navDivider: { padding: '1.5rem 1rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' },
  main: { flex: 1, height: '100vh', overflowY: 'auto' },
  header: { height: '70px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 },
  headerTitle: { fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', margin: 0 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
  content: { padding: '2rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' },
  statCard: { background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '1rem' },
  statIconContainer: { width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statTitle: { color: '#64748b', fontSize: '0.875rem' },
  statValue: { fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' },
  lightPanel: { background: '#fff', padding: '2rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginTop: '2rem' },
  panelTitle: { color: '#1e293b', marginTop: 0, marginBottom: '1.5rem', fontSize: '1.25rem' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { background: '#f8fafc', textAlign: 'left', color: '#64748b', fontSize: '0.8rem', padding: '12px' },
  tableRow: { borderBottom: '1px solid #f1f5f9', color: '#334155' },
  badge: { padding: '2px 8px', borderRadius: '12px', background: '#f1f5f9', fontSize: '0.75rem' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' },
  formStack: { display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: '#475569' },
  input: { padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' },
  submitBtn: { padding: '1rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', marginTop: '1rem' },
  toast: { background: '#f0fdf4', color: '#166534', padding: '4px 12px', borderRadius: '99px', fontSize: '0.8rem', border: '1px solid #bbf7d0' },
  loadingContainer: { textAlign: 'center', padding: '5rem', color: '#64748b' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' },
  userName: { color: '#1e293b', fontWeight: 600, fontSize: '0.9rem' }
};
