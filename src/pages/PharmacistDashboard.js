import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWeb3 } from '../context/Web3Context';

// --- Professional SVG Icons ---
const Icons = {
  Overview: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
  ),
  Inbox: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
  ),
  Sell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
  ),
  Stock: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
  ),
  Receipt: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 17.5V6.5"></path></svg>
  ),
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
  ),
  Alert: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
  )
};

export default function PharmacistDashboard() {
  const { contracts, account } = useWeb3();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const invoiceRef = useRef();

  // Data State
  const [inbox, setInbox] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({ items: 0, stock: 0, revenue: 0 });
  const [actionMsg, setActionMsg] = useState('');

  // Form States
  const [sellData, setSellData] = useState({ batchNumber: '', quantity: '', customerName: '' });
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
      // 1. Fetch Inbox (Incoming from Supplier)
      const pending = await contracts.transfer.getMyPendingInbox();
      setInbox(pending);

      // 2. Fetch Inventory
      const stockIds = await contracts.product.getAvailableStockBatches(account);
      const stockList = [];
      for (let id of stockIds) {
        const b = await contracts.product.getBatch(id);
        const qty = await contracts.product.getStockOf(id, account);
        const s = await contracts.product.getBatchStatus(id);
        
        stockList.push({
          batchNumber: b.batchNumber,
          productName: b.productName,
          quantity: qty.toString(),
          price: b.costPerUnit.toString(),
          currency: b.currency,
          expiry: Number(b.expiryDate),
          status: Number(s)
        });
      }
      setInventory(stockList);

      // 3. Fetch Sales History
      const saleIds = await contracts.transfer.getSalesByPharmacist(account);
      const saleList = [];
      let totalRev = 0;
      for (let id of saleIds) {
        const s = await contracts.transfer.getSale(id);
        saleList.push({
          id: s.saleId.toString(),
          batch: s.batchNumber,
          quantity: s.quantity.toString(),
          total: (Number(s.quantity) * Number(s.pricePerUnit)).toString(),
          date: Number(s.soldAt)
        });
        totalRev += (Number(s.quantity) * Number(s.pricePerUnit));
      }
      setSales(saleList.reverse());
      setStats({
        items: pending.length,
        stock: stockList.filter(i => Number(i.quantity) > 0).length,
        revenue: totalRev
      });

    } catch (err) {
      console.error(err);
      setActionMsg('❌ Error loading dashboard');
    } finally {
      setLoading(false);
    }
  }, [contracts.transfer, contracts.product, account]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAccept = async (id) => {
    try {
      setActionMsg('⏳ Receiving stock...');
      const tx = await contracts.transfer.acceptTransfer(id, "Received at Pharmacy");
      await tx.wait();
      setActionMsg('✅ Stock added to inventory!');
      fetchData();
    } catch (err) { setActionMsg('❌ Error receiving stock'); }
  };

  const handleSell = async (e) => {
    e.preventDefault();
    try {
      const batch = inventory.find(i => i.batchNumber === sellData.batchNumber);
      if (!batch) return;

      setActionMsg('⏳ Processing Sale...');
      const qty = window.BigInt(sellData.quantity);
      const price = window.BigInt(batch.price);

      const tx = await contracts.transfer.sellToBuyer(
        sellData.batchNumber,
        qty,
        price,
        batch.currency,
        `Sold to ${sellData.customerName}`
      );
      await tx.wait();

      setLastInvoice({
        customer: sellData.customerName,
        product: batch.productName,
        batch: batch.batchNumber,
        qty: sellData.quantity,
        price: batch.price,
        total: Number(sellData.quantity) * Number(batch.price),
        currency: batch.currency,
        date: new Date().toLocaleString()
      });

      setActionMsg('✅ Sale Completed!');
      setSellData({ batchNumber: '', quantity: '', customerName: '' });
      fetchData();
      setActiveTab('invoice');
    } catch (err) { 
      console.error(err);
      setActionMsg('❌ ' + (err.reason || err.message)); 
    }
  };

  const printInvoice = () => {
    const printContent = invoiceRef.current;
    const WindowPrt = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    WindowPrt.document.write('<html><head><title>Medicine Invoice</title><style>body{font-family:sans-serif;padding:40px;} .header{text-align:center;margin-bottom:40px;} .row{display:flex;justify-content:space-between;margin-bottom:10px;} .total{border-top:2px solid #000;padding-top:10px;margin-top:20px;font-weight:bold;font-size:1.2rem;} .footer{margin-top:50px;text-align:center;font-size:0.8rem;color:#666;}</style></head><body>');
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
        <div style={styles.sidebarBrand}><span style={{ color: '#ec4899' }}>MediChain</span> Phm</div>
        <nav style={styles.nav}>
          <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} Icon={Icons.Overview} label="Overview" />
          <NavItem active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} Icon={Icons.Inbox} label="Pending Delivery" count={stats.items} />
          <NavItem active={activeTab === 'stock'} onClick={() => setActiveTab('stock')} Icon={Icons.Stock} label="Available Stock" />
          <div style={styles.navDivider}>Point of Sale</div>
          <NavItem active={activeTab === 'sell'} onClick={() => setActiveTab('sell')} Icon={Icons.Sell} label="Sell Medicine" />
          <NavItem active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} Icon={Icons.Receipt} label="Sales History" />
          <div style={styles.navDivider}>Alerts</div>
          <NavItem active={activeTab === 'expired'} onClick={() => setActiveTab('expired')} Icon={Icons.Alert} label="Expired Items" />
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
              {!isMobile && <span style={styles.userName}>Pharmacist</span>}
            </div>
          </div>
        </header>

        <div style={styles.content}>
          {loading ? (
             <div style={styles.loadingContainer}>⌛ Syncing Pharmacy Records...</div>
          ) : (
            <>
              {activeTab === 'overview' && (
                <div style={styles.grid}>
                  <StatCard title="Total Revenue" value={`${stats.revenue} PKR`} Icon={Icons.Receipt} color="#ec4899" />
                  <StatCard title="Batches in Stock" value={stats.stock} Icon={Icons.Stock} color="#10b981" />
                  <StatCard title="Pending Inbox" value={stats.items} Icon={Icons.Inbox} color="#3b82f6" />
                </div>
              )}

              {activeTab === 'inbox' && (
                <div style={styles.lightPanel}>
                  <h3 style={styles.panelTitle}>Incoming Deliveries from Supplier</h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead style={styles.tableHeader}>
                        <tr><th>Batch #</th><th>Supplier</th><th>Quantity</th><th>Date</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {inbox.map(req => (
                          <tr key={req.id.toString()} style={styles.tableRow}>
                            <td style={{fontWeight: 600}}>{req.batchNumber}</td>
                            <td>{req.sender.slice(0,12)}...</td>
                            <td>{req.quantity.toString()}</td>
                            <td>{new Date(Number(req.createdAt)*1000).toLocaleDateString()}</td>
                            <td><button style={styles.btnApprove} onClick={() => handleAccept(req.id)}>Accept</button></td>
                          </tr>
                        ))}
                        {inbox.length === 0 && <tr><td colSpan="5" style={{textAlign: 'center', padding: '2rem'}}>No pending deliveries.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'stock' && (
                <div style={styles.lightPanel}>
                  <h3 style={styles.panelTitle}>Current Pharmacy Stock</h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead style={styles.tableHeader}>
                        <tr><th>Batch #</th><th>Product</th><th>In Stock</th><th>Unit Price</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        {inventory.filter(i => Number(i.quantity) > 0 && i.status === 0).map(b => (
                          <tr key={b.batchNumber} style={styles.tableRow}>
                            <td style={{fontWeight: 600}}>{b.batchNumber}</td>
                            <td>{b.productName}</td>
                            <td style={{fontWeight: 700, color: '#10b981'}}>{b.quantity}</td>
                            <td>{b.price} {b.currency}</td>
                            <td><span style={{...styles.badge, background: '#f0fdf4', color: '#10b981'}}>ACTIVE</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'sell' && (
                <div style={styles.lightPanel}>
                  <h3 style={styles.panelTitle}>Medicine Checkout</h3>
                  <form onSubmit={handleSell} style={styles.formStack}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Select Product from Stock</label>
                      <select style={styles.input} value={sellData.batchNumber} onChange={e => setSellData({...sellData, batchNumber: e.target.value})} required>
                        <option value="">-- Choose Medicine --</option>
                        {inventory.filter(i => Number(i.quantity) > 0 && i.status === 0).map(i => (
                          <option key={i.batchNumber} value={i.batchNumber}>{i.productName} ({i.quantity} units available) - {i.price} {i.currency}</option>
                        ))}
                      </select>
                    </div>
                    <div style={styles.formGroup}><label style={styles.label}>Quantity to Sell</label><input style={styles.input} type="number" value={sellData.quantity} onChange={e => setSellData({...sellData, quantity: e.target.value})} required/></div>
                    <div style={styles.formGroup}><label style={styles.label}>Customer Name</label><input style={styles.input} placeholder="Enter Name" value={sellData.customerName} onChange={e => setSellData({...sellData, customerName: e.target.value})} required/></div>
                    <button type="submit" style={styles.submitBtn}>Complete Sale & Generate Invoice</button>
                  </form>
                </div>
              )}

              {activeTab === 'invoice' && lastInvoice && (
                <div style={styles.lightPanel}>
                   <div ref={invoiceRef} style={{padding: '20px', background: '#fff', border: '1px solid #eee'}}>
                      <div style={{textAlign: 'center', marginBottom: '30px'}}>
                        <h2 style={{color: '#ec4899', margin: 0}}>MEDICHAIN PHARMACY</h2>
                        <p style={{fontSize: '0.8rem', color: '#666'}}>Blockchain Verified Medicine Receipt</p>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '0.9rem'}}>
                        <div>
                          <strong>Customer:</strong> {lastInvoice.customer}<br/>
                          <strong>Date:</strong> {lastInvoice.date}
                        </div>
                        <div>
                          <strong>Receipt #:</strong> {Math.floor(Math.random()*100000)}<br/>
                          <strong>Batch:</strong> {lastInvoice.batch}
                        </div>
                      </div>
                      <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '20px'}}>
                        <thead><tr style={{borderBottom: '2px solid #333', textAlign: 'left'}}><th style={{padding: '8px'}}>Item</th><th style={{padding: '8px'}}>Qty</th><th style={{padding: '8px'}}>Price</th><th style={{padding: '8px', textAlign: 'right'}}>Total</th></tr></thead>
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
                        Thank you for your purchase!<br/>Scan the Batch QR code to verify medicine authenticity.
                      </div>
                   </div>
                   <button onClick={printInvoice} style={{...styles.submitBtn, marginTop: '20px'}}>Print Invoice (PDF)</button>
                </div>
              )}

              {activeTab === 'sales' && (
                <div style={styles.lightPanel}>
                  <h3 style={styles.panelTitle}>Sales Transaction History</h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead style={styles.tableHeader}>
                        <tr><th>Sale ID</th><th>Batch</th><th>Qty</th><th>Total Paid</th><th>Time</th></tr>
                      </thead>
                      <tbody>
                        {sales.map(s => (
                          <tr key={s.id} style={styles.tableRow}>
                            <td>#{s.id}</td>
                            <td>{s.batch}</td>
                            <td>{s.quantity}</td>
                            <td style={{fontWeight: 700}}>{s.total} PKR</td>
                            <td>{new Date(s.date*1000).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'expired' && (
                <div style={styles.lightPanel}>
                  <h3 style={{...styles.panelTitle, color: '#ef4444'}}>Expired / Unsafe Inventory</h3>
                  <p style={{color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem'}}>These items must be removed from the shelf immediately.</p>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead style={styles.tableHeader}><tr><th>Batch #</th><th>Product</th><th>Remaining Qty</th><th>Expiry Date</th></tr></thead>
                      <tbody>
                        {inventory.filter(i => i.status === 1 || i.expiry * 1000 < Date.now()).map(b => (
                          <tr key={b.batchNumber} style={styles.tableRow}>
                            <td>{b.batchNumber}</td>
                            <td>{b.productName}</td>
                            <td>{b.quantity}</td>
                            <td style={{color: '#ef4444'}}>{new Date(b.expiry*1000).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
  navItemActive: { background: '#fdf2f8', color: '#ec4899' },
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
  statValue: { fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' },
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
  submitBtn: { padding: '1rem', background: '#ec4899', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', marginTop: '1rem' },
  btnApprove: { background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' },
  btnReject: { background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' },
  toast: { background: '#fdf2f8', color: '#9d174d', padding: '4px 12px', borderRadius: '99px', fontSize: '0.8rem', border: '1px solid #fbcfe8' },
  loadingContainer: { textAlign: 'center', padding: '5rem', color: '#64748b' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#ec4899', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' },
  userName: { color: '#1e293b', fontWeight: 600, fontSize: '0.9rem' }
};
