import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWeb3 } from '../context/Web3Context';

// --- Professional Emerald SVG Icons ---
const Icons = {
  Overview: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
  ),
  Inbox: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
  ),
  Inventory: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
  ),
  Suppliers: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
  ),
  Transfer: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 3 4 4-4 4"></path><path d="M20 7H4"></path><path d="m8 21-4-4 4-4"></path><path d="M4 17h16"></path></svg>
  ),
  Receipt: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 17.5V6.5"></path></svg>
  ),
  LogOut: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
  ),
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
  )
};

export default function DistributorDashboard() {
  const { contracts, account, disconnectWallet } = useWeb3();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const invoiceRef = useRef();

  // Data State
  const [inbox, setInbox] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [mySuppliers, setMySuppliers] = useState([]);
  const [stats, setStats] = useState({ incoming: 0, stock: 0, sent: 0 });
  const [actionMsg, setActionMsg] = useState('');

  // Form States
  const [transferData, setTransferData] = useState({ batchNumber: '', supplier: '', quantity: '', price: '0' });
  const [suppToAdd, setSuppToAdd] = useState('');
  const [lastInvoice, setLastInvoice] = useState(null);

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
    if (!contracts.transfer || !account) return;
    setLoading(true);
    try {
      const pending = await contracts.transfer.getMyPendingInbox();
      setInbox(pending);
      
      const stockIds = await contracts.product.getAvailableStockBatches(account);
      const stockList = [];
      for (let id of stockIds) {
        const b = await contracts.product.getBatch(id);
        const qty = await contracts.product.getStockOf(id, account);
        if (Number(qty) > 0) {
          stockList.push({
            batchNumber: b.batchNumber,
            productName: b.productName,
            quantity: qty.toString(),
            price: b.costPerUnit.toString(),
            currency: b.currency
          });
        }
      }
      setInventory(stockList);

      const sentCount = await contracts.transfer.getSentTransfers(account);
      setStats({ incoming: pending.length, stock: stockList.length, sent: sentCount.length });

      const allAddrs = await contracts.registry.getAllRegistered();
      const supps = [];
      for (let addr of allAddrs) {
        const entity = await contracts.registry.getEntity(addr);
        if (Number(entity.role) === 4 && Number(entity.status) === 2) {
          supps.push({ address: addr, name: entity.name });
        }
      }
      setAllSuppliers(supps);

      const myS = await contracts.transfer.getSuppliers(account);
      setMySuppliers(myS.map(d => d.toLowerCase()));

    } catch (err) {
      console.error(err);
      setActionMsg('❌ Sync Error');
    } finally {
      setLoading(false);
    }
  }, [contracts.transfer, contracts.product, contracts.registry, account]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAccept = async (id) => {
    try {
      setActionMsg('⏳ Receiving Stock...');
      const tx = await contracts.transfer.acceptTransfer(id, "Received at Distributor");
      await tx.wait();
      setActionMsg('✅ Stock Added!');
      fetchData();
    } catch (err) { setActionMsg('❌ Error'); }
  };

  const handleAddSupplier = async () => {
    if (!suppToAdd) return;
    try {
      setActionMsg('⏳ Authorizing...');
      const tx = await contracts.transfer.addSupplier(suppToAdd);
      await tx.wait();
      setActionMsg('✅ Supplier Added!');
      setSuppToAdd('');
      fetchData();
    } catch (err) { setActionMsg('❌ Auth Failed'); }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      setActionMsg('⏳ Transferring...');
      const batch = inventory.find(i => i.batchNumber === transferData.batchNumber);
      const supplier = allSuppliers.find(s => s.address === transferData.supplier);
      const qty = window.BigInt(transferData.quantity);
      const price = window.BigInt(transferData.price === '0' ? batch.price : transferData.price);

      const tx = await contracts.transfer.requestTransfer(
        1, // DIST_TO_SUPP
        transferData.batchNumber,
        transferData.supplier,
        qty,
        price,
        batch.currency,
        "Shipment from Distributor"
      );
      await tx.wait();

      setLastInvoice({
        type: 'B2B Delivery Note',
        receiver: supplier.name,
        receiverAddr: transferData.supplier,
        product: batch.productName,
        batch: batch.batchNumber,
        qty: transferData.quantity,
        price: price.toString(),
        total: Number(transferData.quantity) * Number(price),
        currency: batch.currency,
        date: new Date().toLocaleString()
      });

      setActionMsg('✅ Shipment Requested!');
      setTransferData({ batchNumber: '', supplier: '', quantity: '', price: '0' });
      fetchData();
      setActiveTab('invoice');
    } catch (err) { setActionMsg('❌ ' + (err.reason || 'Failed')); }
  };

  const printInvoice = () => {
    const WindowPrt = window.open('', '', 'left=0,top=0,width=800,height=900');
    WindowPrt.document.write('<html><head><title>Invoice</title><style>body{font-family:sans-serif;padding:40px;} .header{text-align:center;margin-bottom:40px;color:#10b981;} .total{border-top:2px solid #333;padding-top:10px;margin-top:20px;font-weight:bold;font-size:1.2rem;text-align:right;}</style></head><body>');
    WindowPrt.document.write(invoiceRef.current.innerHTML);
    WindowPrt.document.write('</body></html>');
    WindowPrt.document.close();
    WindowPrt.focus();
    WindowPrt.print();
    WindowPrt.close();
  };

  return (
    <div style={styles.dashboardWrapper}>
      {isMobile && sidebarOpen && <div style={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}

      <div style={{ ...styles.sidebar, left: sidebarOpen ? '0' : '-280px' }}>
        <div style={styles.sidebarBrand}>
          <span style={{ color: 'var(--accent-primary)' }}>MediChain</span>
          <span style={styles.roleTag}>Distributor</span>
        </div>
        <nav style={styles.nav}>
          <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} Icon={Icons.Overview} label="Dashboard" />
          <NavItem active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} Icon={Icons.Inbox} label="Incoming Stock" count={stats.incoming} />
          <NavItem active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} Icon={Icons.Inventory} label="Active Stock" />
          <div style={styles.navDivider}>Supply Chain</div>
          <NavItem active={activeTab === 'suppliers'} onClick={() => setActiveTab('suppliers')} Icon={Icons.Suppliers} label="Manage Suppliers" />
          <NavItem active={activeTab === 'transfer'} onClick={() => setActiveTab('transfer')} Icon={Icons.Transfer} label="Ship Products" />
          {lastInvoice && <NavItem active={activeTab === 'invoice'} onClick={() => setActiveTab('invoice')} Icon={Icons.Receipt} label="Last Invoice" />}
        </nav>
        <div style={styles.sidebarFooter}>
           <button onClick={disconnectWallet} style={styles.logoutBtn}><Icons.LogOut /> <span>Disconnect</span></button>
        </div>
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
                 <div style={styles.avatar}>{account?.slice(2,4).toUpperCase()}</div>
                 {!isMobile && <span style={styles.userName}>Distributor Node</span>}
              </div>
           </div>
        </header>

        <div style={styles.content} className="animate-fade-in">
           {loading ? (
              <div style={styles.loadingContainer}>⌛ Syncing...</div>
           ) : (
             <>
               {activeTab === 'overview' && (
                 <div style={styles.statsGrid}>
                   <StatCard title="Inbound Pending" value={stats.incoming} Icon={Icons.Inbox} color="#10b981" />
                   <StatCard title="Stock Batches" value={stats.stock} Icon={Icons.Inventory} color="#3b82f6" />
                   <StatCard title="Total Shipments" value={stats.sent} Icon={Icons.Transfer} color="#6366f1" />
                 </div>
               )}

               {activeTab === 'inbox' && (
                 <div className="glass-panel">
                    <h3 style={styles.panelTitle}>Pending Deliveries from Manufacturers</h3>
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead><tr style={styles.tableHeader}><th>Batch #</th><th>Sender</th><th>Quantity</th><th>Date</th><th>Action</th></tr></thead>
                        <tbody>
                          {inbox.map(req => (
                            <tr key={req.id.toString()} style={styles.tableRow}>
                              <td style={{fontWeight: 700}}>{req.batchNumber}</td>
                              <td>{req.sender.slice(0,12)}...</td>
                              <td>{req.quantity.toString()}</td>
                              <td>{new Date(Number(req.createdAt)*1000).toLocaleDateString()}</td>
                              <td><button className="btn btn-primary" style={{padding: '0.4rem 1rem', fontSize: '0.8rem'}} onClick={() => handleAccept(req.id)}>Accept</button></td>
                            </tr>
                          ))}
                          {inbox.length === 0 && <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>No pending stock.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                 </div>
               )}

               {activeTab === 'inventory' && (
                 <div className="glass-panel">
                    <h3 style={styles.panelTitle}>Available Medicine Inventory</h3>
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead><tr style={styles.tableHeader}><th>Batch #</th><th>Product</th><th>Price</th><th>Units In Stock</th></tr></thead>
                        <tbody>
                          {inventory.map(b => (
                            <tr key={b.batchNumber} style={styles.tableRow}>
                              <td style={{fontWeight: 700}}>{b.batchNumber}</td>
                              <td>{b.productName}</td>
                              <td>{b.price} {b.currency}</td>
                              <td style={{fontWeight: 700, color: '#10b981'}}>{b.quantity} units</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
               )}

               {activeTab === 'suppliers' && (
                 <div className="glass-panel">
                    <h3 style={styles.panelTitle}>Whitelisted Supplier Network</h3>
                    <div style={{display: 'flex', gap: '1rem', marginBottom: '2.5rem'}}>
                      <select style={styles.input} value={suppToAdd} onChange={e => setSuppToAdd(e.target.value)}>
                        <option value="">-- Choose Supplier to Add --</option>
                        {allSuppliers.filter(s => !mySuppliers.includes(s.address.toLowerCase())).map(s => (
                          <option key={s.address} value={s.address}>{s.name} ({s.address.slice(0,12)}...)</option>
                        ))}
                      </select>
                      <button onClick={handleAddSupplier} className="btn btn-primary">Authorize Supplier</button>
                    </div>
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead><tr style={styles.tableHeader}><th>Supplier Name</th><th>Address</th><th>Status</th></tr></thead>
                        <tbody>
                          {allSuppliers.filter(s => mySuppliers.includes(s.address.toLowerCase())).map(s => (
                            <tr key={s.address} style={styles.tableRow}>
                              <td style={{fontWeight: 700}}>{s.name}</td><td>{s.address}</td><td><span style={{...styles.badge, background: '#f0fdf4', color: '#10b981'}}>AUTHORIZED</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
               )}

               {activeTab === 'transfer' && (
                 <div className="glass-panel" style={{maxWidth: '600px'}}>
                   <h3 style={styles.panelTitle}>Initialize Stock Transfer</h3>
                   <form onSubmit={handleTransfer} style={styles.formStack}>
                      <div style={styles.formGroup}><label style={styles.label}>Select Batch</label>
                        <select style={styles.input} value={transferData.batchNumber} onChange={e => setTransferData({...transferData, batchNumber: e.target.value})} required>
                          <option value="">-- Choose Batch --</option>
                          {inventory.map(b => <option key={b.batchNumber} value={b.batchNumber}>{b.productName} ({b.quantity} avail)</option>)}
                        </select>
                      </div>
                      <div style={styles.formGroup}><label style={styles.label}>Receiver Supplier</label>
                        <select style={styles.input} value={transferData.supplier} onChange={e => setTransferData({...transferData, supplier: e.target.value})} required>
                          <option value="">-- Choose Authorized Supplier --</option>
                          {allSuppliers.filter(s => mySuppliers.includes(s.address.toLowerCase())).map(s => <option key={s.address} value={s.address}>{s.name}</option>)}
                        </select>
                      </div>
                      <div style={styles.formGroup}><label style={styles.label}>Quantity</label><input type="number" style={styles.input} value={transferData.quantity} onChange={e => setTransferData({...transferData, quantity: e.target.value})} required /></div>
                      <div style={styles.formGroup}><label style={styles.label}>Transfer Price (0 for default)</label><input type="number" style={styles.input} value={transferData.price} onChange={e => setTransferData({...transferData, price: e.target.value})} /></div>
                      <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}}>Send Products</button>
                   </form>
                 </div>
               )}

               {activeTab === 'invoice' && lastInvoice && (
                 <div className="glass-panel">
                    <div ref={invoiceRef} style={{padding: '30px', background: 'white', border: '1px solid #e2e8f0'}}>
                       <div style={{textAlign: 'center', marginBottom: '30px'}}><h2 style={{color: '#10b981', margin: 0}}>DISTRIBUTION INVOICE</h2><p style={{fontSize: '0.8rem', color: '#64748b'}}>Blockchain Verified Transfer</p></div>
                       <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '30px'}}>
                          <div><strong>From:</strong> Distributor ({account.slice(0,10)}...)<br/><strong>To:</strong> {lastInvoice.receiver} ({lastInvoice.receiverAddr.slice(0,10)}...)</div>
                          <div style={{textAlign: 'right'}}><strong>Date:</strong> {lastInvoice.date}<br/><strong>Batch:</strong> {lastInvoice.batch}</div>
                       </div>
                       <table style={{width: '100%', borderCollapse: 'collapse'}}>
                          <thead><tr style={{borderBottom: '2px solid #0f172a', textAlign: 'left'}}><th style={{padding: '8px'}}>Medicine</th><th>Qty</th><th>Unit Price</th><th style={{textAlign: 'right'}}>Total</th></tr></thead>
                          <tbody><tr><td style={{padding: '12px 8px'}}>{lastInvoice.product}</td><td>{lastInvoice.qty}</td><td>{lastInvoice.price}</td><td style={{textAlign: 'right'}}>{lastInvoice.total} {lastInvoice.currency}</td></tr></tbody>
                       </table>
                       <div className="total">Grand Total: {lastInvoice.total} {lastInvoice.currency}</div>
                    </div>
                    <button onClick={printInvoice} className="btn btn-primary" style={{marginTop: '2rem'}}>Print Invoice</button>
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
  <div onClick={onClick} style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}><Icon /><span style={{ marginLeft: '12px', flex: 1 }}>{label}</span>{count > 0 && <span style={styles.navCount}>{count}</span>}</div>
);

const StatCard = ({ title, value, Icon, color }) => (
  <div style={{ ...styles.statCard, borderTop: `4px solid ${color}` }}>
    <div style={{ ...styles.statIconContainer, color: color, background: `${color}10` }}><Icon /></div>
    <div><div style={styles.statTitle}>{title}</div><div style={styles.statValue}>{value}</div></div>
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
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  badge: { padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700 },
  formStack: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.85rem', fontWeight: 700, color: '#475569' },
  input: { padding: '0.875rem', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#0f172a', fontSize: '0.95rem' },
  loadingContainer: { textAlign: 'center', padding: '5rem', color: '#64748b' }
};
