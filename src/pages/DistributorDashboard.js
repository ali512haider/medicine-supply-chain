import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useNavigate } from 'react-router-dom';

// --- Professional SVG Icons ---
const Icons = {
  Overview: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
  ),
  Inbox: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
  ),
  Transfer: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 3 4 4-4 4"></path><path d="M20 7H4"></path><path d="m8 21-4-4 4-4"></path><path d="M4 17h16"></path></svg>
  ),
  Inventory: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
  ),
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
  ),
  UserPlus: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
  ),
  Receipt: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 17.5V6.5"></path></svg>
  )
};

export default function DistributorDashboard() {
  const { contracts, account } = useWeb3();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const invoiceRef = useRef();

  // Data State
  const [inbox, setInbox] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [myWhitelistedSuppliers, setMyWhitelistedSuppliers] = useState([]);
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
      // 1. Fetch Inbox
      const pendingRequests = await contracts.transfer.getMyPendingInbox();
      setInbox(pendingRequests);
      
      // 2. Fetch My Inventory
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
            manufacturer: b.manufacturer,
            price: b.costPerUnit.toString(),
            currency: b.currency
          });
        }
      }
      setInventory(stockList);

      // 3. Stats
      const sentCount = await contracts.transfer.getSentTransfers(account);
      setStats({
        incoming: pendingRequests.length,
        stock: stockList.length,
        sent: sentCount.length
      });

      // 4. Fetch All Approved Suppliers
      const allAddrs = await contracts.registry.getAllRegistered();
      const supps = [];
      for (let addr of allAddrs) {
        const entity = await contracts.registry.getEntity(addr);
        if (Number(entity.role) === 4 && Number(entity.status) === 2) {
          supps.push({ address: addr, name: entity.name });
        }
      }
      setAllSuppliers(supps);

      // 5. My Whitelisted Suppliers
      const mySupps = await contracts.transfer.getSuppliers(account);
      setMyWhitelistedSuppliers(mySupps.map(addr => addr.toLowerCase()));

    } catch (err) {
      console.error(err);
      setActionMsg('❌ Error loading dashboard');
    } finally {
      setLoading(false);
    }
  }, [contracts.transfer, contracts.product, contracts.registry, account]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAccept = async (id) => {
    try {
      setActionMsg('⏳ Accepting...');
      const tx = await contracts.transfer.acceptTransfer(id, "Received by Distributor");
      await tx.wait();
      setActionMsg('✅ Accepted!');
      fetchData();
    } catch (err) { setActionMsg('❌ Accept Failed'); }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Reason for rejection:");
    if (!reason) return;
    try {
      setActionMsg('⏳ Rejecting...');
      const tx = await contracts.transfer.rejectTransfer(id, reason);
      await tx.wait();
      setActionMsg('✅ Rejected');
      fetchData();
    } catch (err) { setActionMsg('❌ Reject Failed'); }
  };

  const handleAddSupplier = async () => {
    if (!suppToAdd) return;
    try {
      setActionMsg('⏳ Adding Supplier...');
      const tx = await contracts.transfer.addSupplier(suppToAdd);
      await tx.wait();
      setActionMsg('✅ Supplier Added!');
      setSuppToAdd('');
      fetchData();
    } catch (err) { setActionMsg('❌ Failed to add supplier'); }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      setActionMsg('⏳ Initiating Transfer...');
      const batch = inventory.find(i => i.batchNumber === transferData.batchNumber);
      const supplier = allSuppliers.find(s => s.address === transferData.supplier);
      
      const qty = window.BigInt(transferData.quantity || 0);
      const price = window.BigInt(transferData.price || batch.price);
      
      const tx = await contracts.transfer.requestTransfer(
        1, 
        transferData.batchNumber,
        transferData.supplier,
        qty,
        price,
        batch.currency,
        `Shipment from distributor ${account.slice(0,6)}`
      );
      await tx.wait();

      setLastInvoice({
        type: 'Delivery Note / B2B Invoice',
        sender: 'Distributor',
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

      setActionMsg('✅ Transfer Requested!');
      setTransferData({ batchNumber: '', supplier: '', quantity: '', price: '0' });
      fetchData();
      setActiveTab('invoice');
    } catch (err) { setActionMsg('❌ ' + (err.reason || err.message)); }
  };

  const printInvoice = () => {
    const printContent = invoiceRef.current;
    const WindowPrt = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    WindowPrt.document.write('<html><head><title>B2B Invoice</title><style>body{font-family:sans-serif;padding:40px;} .header{text-align:center;margin-bottom:40px;} .row{display:flex;justify-content:space-between;margin-bottom:10px;} .total{border-top:2px solid #000;padding-top:10px;margin-top:20px;font-weight:bold;font-size:1.2rem;} .footer{margin-top:50px;text-align:center;font-size:0.8rem;color:#666;}</style></head><body>');
    WindowPrt.document.write(printContent.innerHTML);
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
        <div style={styles.sidebarBrand}><span style={{ color: '#3b82f6' }}>MediChain</span> Dist</div>
        <nav style={styles.nav}>
          <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} Icon={Icons.Overview} label="Overview" />
          <NavItem active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} Icon={Icons.Inbox} label="Incoming Shipments" count={stats.incoming} />
          <NavItem active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} Icon={Icons.Inventory} label="My Stock" />
          <div style={styles.navDivider}>Distribution</div>
          <NavItem active={activeTab === 'suppliers'} onClick={() => setActiveTab('suppliers')} Icon={Icons.UserPlus} label="My Suppliers" />
          <NavItem active={activeTab === 'transfer'} onClick={() => setActiveTab('transfer')} Icon={Icons.Transfer} label="Transfer Stock" />
          {lastInvoice && <NavItem active={activeTab === 'invoice'} onClick={() => setActiveTab('invoice')} Icon={Icons.Receipt} label="Last Invoice" />}
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
              {!isMobile && <span style={styles.userName}>Distributor</span>}
            </div>
          </div>
        </header>

        <div style={styles.content}>
          {loading ? (
             <div style={styles.loadingContainer}>⌛ Syncing...</div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div style={styles.grid}>
                  <StatCard title="Pending Inbox" value={stats.incoming} Icon={Icons.Inbox} color="#3b82f6" />
                  <StatCard title="Active Batches" value={stats.stock} Icon={Icons.Inventory} color="#10b981" />
                  <StatCard title="Total Transfers" value={stats.sent} Icon={Icons.Transfer} color="#6366f1" />
                </div>
              )}

              {activeTab === 'inbox' && (
                <div style={styles.lightPanel}>
                  <h3 style={styles.panelTitle}>Pending Incoming Shipments</h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead style={styles.tableHeader}>
                        <tr><th>Batch #</th><th>Sender (Mfr)</th><th>Quantity</th><th>Date</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {inbox.map(req => (
                          <tr key={req.id.toString()} style={styles.tableRow}>
                            <td style={{fontWeight: 600}}>{req.batchNumber}</td>
                            <td>{req.sender.slice(0,12)}...</td>
                            <td>{req.quantity.toString()}</td>
                            <td>{new Date(Number(req.createdAt)*1000).toLocaleDateString()}</td>
                            <td>
                              <div style={{display: 'flex', gap: '0.5rem'}}>
                                <button style={styles.btnApprove} onClick={() => handleAccept(req.id)}>Accept</button>
                                <button style={styles.btnReject} onClick={() => handleReject(req.id)}>Reject</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'inventory' && (
                <div style={styles.lightPanel}>
                  <h3 style={styles.panelTitle}>Available Medicine Stock</h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead style={styles.tableHeader}>
                        <tr><th>Batch #</th><th>Product</th><th>Original Price</th><th>In Stock</th></tr>
                      </thead>
                      <tbody>
                        {inventory.map(b => (
                          <tr key={b.batchNumber} style={styles.tableRow}>
                            <td style={{fontWeight: 600}}>{b.batchNumber}</td>
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
                <div style={styles.lightPanel}>
                  <h3 style={styles.panelTitle}>Manage My Suppliers</h3>
                  <div style={{display: 'flex', gap: '1rem', marginBottom: '2rem'}}>
                    <select style={{...styles.input, flex: 1}} value={suppToAdd} onChange={e => setSuppToAdd(e.target.value)}>
                      <option value="">-- Choose Supplier --</option>
                      {allSuppliers.filter(s => !myWhitelistedSuppliers.includes(s.address.toLowerCase())).map(s => (
                        <option key={s.address} value={s.address}>{s.name} ({s.address.slice(0,10)}...)</option>
                      ))}
                    </select>
                    <button onClick={handleAddSupplier} style={{...styles.submitBtn, marginTop: 0, padding: '0 2rem'}}>Add Supplier</button>
                  </div>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead style={styles.tableHeader}><tr><th>Name</th><th>Wallet Address</th><th>Status</th></tr></thead>
                      <tbody>
                        {allSuppliers.filter(s => myWhitelistedSuppliers.includes(s.address.toLowerCase())).map(s => (
                          <tr key={s.address} style={styles.tableRow}>
                            <td>{s.name}</td><td>{s.address}</td><td><span style={{...styles.badge, background: '#f0fdf4', color: '#10b981'}}>AUTHORIZED</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'transfer' && (
                <div style={styles.lightPanel}>
                  <h3 style={styles.panelTitle}>Initiate Transfer to Supplier</h3>
                  <form onSubmit={handleTransfer} style={styles.formStack}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Select Batch</label>
                      <select style={styles.input} value={transferData.batchNumber} onChange={e => setTransferData({...transferData, batchNumber: e.target.value})} required>
                        <option value="">-- Select Batch --</option>
                        {inventory.map(b => (
                          <option key={b.batchNumber} value={b.batchNumber}>{b.productName} ({b.quantity} available)</option>
                        ))}
                      </select>
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Target Supplier</label>
                      <select style={styles.input} value={transferData.supplier} onChange={e => setTransferData({...transferData, supplier: e.target.value})} required>
                        <option value="">-- Select Supplier --</option>
                        {allSuppliers.filter(s => myWhitelistedSuppliers.includes(s.address.toLowerCase())).map(s => (
                          <option key={s.address} value={s.address}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div style={styles.formGroup}><label style={styles.label}>Quantity</label><input style={styles.input} type="number" value={transferData.quantity} onChange={e => setTransferData({...transferData, quantity: e.target.value})} required/></div>
                    <div style={styles.formGroup}><label style={styles.label}>Custom Transfer Price (Optional)</label><input style={styles.input} type="number" value={transferData.price} onChange={e => setTransferData({...transferData, price: e.target.value})} placeholder="0 for default"/></div>
                    <button type="submit" style={styles.submitBtn}>Send Stock & Generate Invoice</button>
                  </form>
                </div>
              )}

              {activeTab === 'invoice' && lastInvoice && (
                <div style={styles.lightPanel}>
                   <div ref={invoiceRef} style={{padding: '30px', background: '#fff', border: '1px solid #ddd'}}>
                      <div style={{textAlign: 'center', marginBottom: '30px'}}>
                        <h2 style={{color: '#3b82f6', margin: 0}}>MEDICHAIN B2B INVOICE</h2>
                        <p style={{fontSize: '0.8rem', color: '#666'}}>Supply Chain Transfer Document</p>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.9rem'}}>
                        <div>
                          <strong>From:</strong> {lastInvoice.sender} ({account.slice(0,10)}...)<br/>
                          <strong>To:</strong> {lastInvoice.receiver} ({lastInvoice.receiverAddr.slice(0,10)}...)
                        </div>
                        <div style={{textAlign: 'right'}}>
                          <strong>Date:</strong> {lastInvoice.date}<br/>
                          <strong>Batch:</strong> {lastInvoice.batch}
                        </div>
                      </div>
                      <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '20px'}}>
                        <thead><tr style={{borderBottom: '2px solid #333', textAlign: 'left'}}><th style={{padding: '8px'}}>Medicine Name</th><th style={{padding: '8px'}}>Qty</th><th style={{padding: '8px'}}>Unit Price</th><th style={{padding: '8px', textAlign: 'right'}}>Total</th></tr></thead>
                        <tbody>
                          <tr>
                            <td style={{padding: '8px'}}>{lastInvoice.product}</td>
                            <td style={{padding: '8px'}}>{lastInvoice.qty}</td>
                            <td style={{padding: '8px'}}>{lastInvoice.price}</td>
                            <td style={{padding: '8px', textAlign: 'right'}}>{lastInvoice.total} {lastInvoice.currency}</td>
                          </tr>
                        </tbody>
                      </table>
                      <div style={{textAlign: 'right', borderTop: '2px solid #333', paddingTop: '10px', fontSize: '1.2rem', fontWeight: 800}}>
                        Grand Total: {lastInvoice.total} {lastInvoice.currency}
                      </div>
                      <div style={{marginTop: '40px', textAlign: 'center', fontSize: '0.75rem', color: '#888'}}>
                        This is a blockchain-verified delivery note. No signature required.
                      </div>
                   </div>
                   <button onClick={printInvoice} style={{...styles.submitBtn, marginTop: '20px'}}>Print / Save as PDF</button>
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
  navItemActive: { background: '#f1f5f9', color: '#3b82f6' },
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
  formStack: { display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '500px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: '#475569' },
  input: { padding: '0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.9rem' },
  submitBtn: { padding: '1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', marginTop: '1rem' },
  btnApprove: { background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' },
  btnReject: { background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' },
  toast: { background: '#eff6ff', color: '#1e40af', padding: '4px 12px', borderRadius: '99px', fontSize: '0.8rem', border: '1px solid #bfdbfe' },
  loadingContainer: { textAlign: 'center', padding: '5rem', color: '#64748b' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' },
  userName: { color: '#1e293b', fontWeight: 600, fontSize: '0.9rem' }
};
