import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWeb3 } from '../context/Web3Context';
import QRCodeDisplay from '../components/QRCodeDisplay';
import QRScanner from '../components/QRScanner';

// --- Professional Emerald SVG Icons ---
const Icons = {
  Overview: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
  ),
  Inbox: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
  ),
  Inventory: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
  ),
  Sale: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
  ),
  History: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
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
  Scanner: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><line x1="7" y1="12" x2="17" y2="12"></line></svg>
  ),
  Bell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
  )
};

export default function PharmacistDashboard() {
  const { contracts, account, disconnectWallet } = useWeb3();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const invoiceRef = useRef();

  // State
  const [stats, setStats] = useState({ stock: 0, sales: 0, incoming: 0 });
  const [inbox, setInbox] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [saleHistory, setSaleHistory] = useState([]);
  const [actionMsg, setActionMsg] = useState('');

  // QR States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState(null);

  // Cart/Sale States
  const [customerName, setCustomerName] = useState('');
  const [cart, setCart] = useState([]);
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

  const [entityName, setEntityName] = useState('Pharmacist Node');

  const fetchData = useCallback(async () => {
    if (!contracts.transfer || !contracts.product || !contracts.registry || !account) return;
    setLoading(true);
    try {
      const myEntity = await contracts.registry.getEntity(account);
      setEntityName(myEntity.name);

      const bNos = await contracts.product.getAllBatchNumbers();
      
      const inRequests = await contracts.transfer.getMyPendingInbox();
      const inboxWithNames = [];
      for (let req of inRequests) {
        try {
          const b = await contracts.product.getBatch(req.batchNumber);
          inboxWithNames.push({
            id: req.id,
            batchNumber: req.batchNumber,
            productName: b.productName,
            sender: req.sender,
            quantity: req.quantity.toString()
          });
        } catch (e) {
          inboxWithNames.push({ ...req, productName: 'Unknown' });
        }
      }
      setInbox(inboxWithNames);

      const stockList = [];
      for (let bn of bNos) {
        const qty = await contracts.product.getStockOf(bn, account);
        if (Number(qty) > 0) {
          const b = await contracts.product.getBatch(bn);
          stockList.push({ 
            batchNumber: bn, 
            productName: b.productName, 
            quantity: qty.toString(), 
            price: b.costPerUnit.toString(),
            currency: b.currency,
            expiryDate: Number(b.expiryDate)
          });
        }
      }
      setInventory(stockList);

      // Fetch Sales Record
      let mySaleIds = [];
      try {
        mySaleIds = await contracts.transfer.getSalesByPharmacist(account);
        console.log("Pharmacist Sale IDs found:", mySaleIds.length);
      } catch (e) {
        console.error("Failed to fetch sale IDs:", e);
      }
      
      const sales = [];
      for (let id of mySaleIds) {
        try {
          const s = await contracts.transfer.getSale(id);
          const b = await contracts.product.getBatch(s.batchNumber);
          sales.push({ 
            saleId: s.saleId.toString(),
            productName: b.productName || 'Unknown Product',
            batchNumber: s.batchNumber,
            quantity: s.quantity.toString(),
            pricePerUnit: s.pricePerUnit.toString(),
            currency: s.currency || 'PKR',
            soldAt: Number(s.soldAt),
            customer: s.buyerNote
          });
        } catch (e) {
          console.error("Error fetching individual sale details:", id.toString(), e);
        }
      }
      
      const sortedSales = sales.sort((a, b) => b.soldAt - a.soldAt);
      setSaleHistory(sortedSales);
      setStats({ 
        stock: stockList.length, 
        sales: mySaleIds.length, 
        incoming: inRequests.length 
      });

    } catch (err) { console.error("Pharmacist Sync Error:", err); }
    finally { setLoading(false); }
  }, [contracts.transfer, contracts.product, account]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAcceptTransfer = async (id) => {
    try {
      setActionMsg('⏳ Receiving Stock...');
      const tx = await contracts.transfer.acceptTransfer(id, "Received via QR Validation");
      await tx.wait();
      setActionMsg('✅ Stock Added!');
      fetchData();
    } catch (err) { setActionMsg('❌ Error'); }
  };

  const onScanSuccess = (decodedText) => {
    setIsScannerOpen(false);
    const scannedBatch = decodedText.trim();
    
    if (scannerTarget === 'inbox') {
      const match = inbox.find(req => req.batchNumber === scannedBatch);
      if (match) {
        handleAcceptTransfer(match.id);
      } else {
        setActionMsg('⚠️ Scanned Batch not in Deliveries');
      }
    } else if (scannerTarget === 'cart') {
      const match = inventory.find(b => b.batchNumber === scannedBatch);
      if (match) {
        setSelectedBatch(scannedBatch);
        addToCartByValue(scannedBatch);
      } else {
        setActionMsg('⚠️ Medicine not on Shelf');
      }
    }
  };

  const addToCartByValue = (bn) => {
    const item = inventory.find(i => i.batchNumber === bn);
    if (!item) return;
    if (cart.find(c => c.batchNumber === bn)) return;

    setCart(prev => [...prev, {
      batchNumber: item.batchNumber,
      productName: item.productName,
      quantity: '1',
      price: item.price,
      currency: item.currency
    }]);
  };

  const addToCart = () => {
    if (!selectedBatch) return;
    addToCartByValue(selectedBatch);
    setSelectedBatch('');
  };

  const removeFromCart = (bn) => {
    setCart(cart.filter(c => c.batchNumber !== bn));
  };

  const updateCartItem = (bn, field, value) => {
    setCart(cart.map(c => c.batchNumber === bn ? { ...c, [field]: value } : c));
  };

  const handleCheckout = async (e) => {
    if (e) e.preventDefault();
    if (!customerName || cart.length === 0) {
      setActionMsg('⚠️ Enter customer name and add medicines');
      return;
    }

    try {
      setActionMsg('⏳ Processing Checkout...');
      const results = [];

      for (const item of cart) {
        const nQty = Number(item.quantity);
        if (isNaN(nQty) || nQty <= 0) continue;

        setActionMsg(`⏳ Registering Sale: ${item.productName}...`);
        const qtyBI = window.BigInt(Math.floor(nQty));
        const priceBI = window.BigInt(Math.floor(Number(item.price)));

        const tx = await contracts.transfer.sellToBuyer(item.batchNumber, qtyBI, priceBI, item.currency || 'PKR', `Sold to ${customerName}`);
        await tx.wait();
        results.push({ ...item, total: nQty * Number(item.price) });
      }

      if (results.length === 0) return;

      setLastInvoice({
        customer: customerName,
        items: results,
        grandTotal: results.reduce((sum, i) => sum + i.total, 0),
        currency: results[0]?.currency || 'PKR',
        date: new Date().toLocaleString()
      });

      setActionMsg('✅ Checkout Successful!');
      setCart([]);
      setCustomerName('');
      fetchData();
      setActiveTab('invoice');
    } catch (err) { setActionMsg('❌ Failed'); }
  };

  const printInvoice = () => {
    const WindowPrt = window.open('', '', 'left=0,top=0,width=800,height=900');
    WindowPrt.document.write('<html><head><title>Pharmacy Receipt</title><style>body{font-family:sans-serif;padding:40px;color:#0f172a;} .header{text-align:center;margin-bottom:30px;color:#10b981;border-bottom:1px solid #f1f5f9;padding-bottom:15px;}</style></head><body>');
    WindowPrt.document.write(invoiceRef.current.innerHTML);
    WindowPrt.document.write('</body></html>');
    WindowPrt.document.close();
    WindowPrt.focus();
    WindowPrt.print();
    WindowPrt.close();
  };

  const expiredStockAlerts = inventory.filter(b => Number(b.quantity) > 0 && Number(b.expiryDate) * 1000 < Date.now());
  const notifications = [
    ...inbox.map(req => ({
      id: `req-${req.id}`,
      type: 'transfer',
      title: 'New Inbound Transfer',
      text: `${req.quantity} units of ${req.productName} from ${req.sender.slice(0, 10)}...`,
      date: 'Pending'
    })),
    ...expiredStockAlerts.map(b => ({
      id: `exp-${b.batchNumber}`,
      type: 'expiry',
      title: 'Expired Stock Alert',
      text: `Batch #${b.batchNumber} (${b.productName}) on shelf has expired.`,
      date: new Date(b.expiryDate * 1000).toLocaleDateString()
    }))
  ];

  return (
    <div style={styles.dashboardWrapper}>
      <QRScanner 
        isOpen={isScannerOpen} 
        onClose={() => setIsScannerOpen(false)} 
        onScanSuccess={onScanSuccess} 
        onScanError={() => {}} 
      />

      {isMobile && sidebarOpen && <div style={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />}
      <div style={{ ...styles.sidebar, left: sidebarOpen ? '0' : '-280px' }}>
        <div style={styles.sidebarBrand}><span style={{ color: 'var(--accent-primary)' }}>MediTrace</span><span style={styles.roleTag}>Pharmacist</span></div>
        <nav style={styles.nav}>
          <NavItem active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} Icon={Icons.Overview} label="Overview" />
          <NavItem active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} Icon={Icons.Inbox} label="New Stock" count={stats.incoming} />
          <NavItem active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} Icon={Icons.Inventory} label="Pharmacy Shelf" />
          <NavItem active={activeTab === 'sale'} onClick={() => setActiveTab('sale')} Icon={Icons.Sale} label="Point of Sale" />
          <NavItem active={activeTab === 'history'} onClick={() => setActiveTab('history')} Icon={Icons.History} label="Sales Record" />
        </nav>
        <div style={styles.sidebarFooter}><button onClick={disconnectWallet} style={styles.logoutBtn}><Icons.LogOut /> <span>Disconnect</span></button></div>
      </div>

      <div style={{ ...styles.main, marginLeft: isMobile ? '0' : '280px' }}>
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isMobile && <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.iconBtn}><Icons.Menu /></button>}
            <h1 style={styles.headerTitle}>{activeTab.replace('-', ' ').toUpperCase()}</h1>
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

            <div style={styles.userProfile}><div style={{...styles.avatar, background: '#10b981'}}>PH</div>{!isMobile && <span style={styles.userName}>{entityName}</span>}</div>
          </div>
        </header>

        <div style={styles.content} className="animate-fade-in">
          {loading ? ( <div style={styles.loadingContainer}>⌛ Syncing Pharmacy Node...</div> ) : (
            <>
              {activeTab === 'overview' && (
                <div style={styles.statsGrid}>
                  <StatCard title="Medicines on Shelf" value={stats.stock} Icon={Icons.Inventory} color="#10b981" />
                  <StatCard title="Total Sales" value={stats.sales} Icon={Icons.Sale} color="#3b82f6" />
                  <StatCard title="Incoming Stock" value={stats.incoming} Icon={Icons.Inbox} color="#f59e0b" />
                </div>
              )}

              {activeTab === 'inbox' && (
                <div className="glass-panel">
                   <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                    <h3 style={{margin: 0, fontSize: '1.2rem'}}>Pending Deliveries</h3>
                    <button onClick={() => { setScannerTarget('inbox'); setIsScannerOpen(true); }} className="btn btn-outline" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: '#10b981', color: '#10b981'}}>
                      <Icons.Scanner /> Scan to Receive
                    </button>
                  </div>
                  <table style={styles.table}>
                    <thead><tr style={styles.tableHeader}><th>Medicine</th><th>Batch #</th><th>Supplier</th><th>Qty</th><th>Action</th></tr></thead>
                    <tbody>
                      {inbox.map(req => (
                        <tr key={req.id.toString()} style={styles.tableRow}>
                          <td style={{fontWeight: 700}}>{req.productName}</td>
                          <td>{req.batchNumber}</td>
                          <td style={{fontSize: '0.8rem'}}>{req.sender.slice(0,10)}...</td>
                          <td>{req.quantity}</td>
                          <td><button onClick={() => handleAcceptTransfer(req.id)} className="btn btn-primary" style={{padding: '4px 12px', fontSize: '0.8rem'}}>Accept</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'inventory' && (
                <div className="glass-panel">
                  <h3 style={styles.panelTitle}>Shelf Inventory</h3>
                  <table style={styles.table}>
                    <thead><tr style={styles.tableHeader}><th>Batch QR</th><th>Medicine Name</th><th>Batch #</th><th>Price</th><th>Stock</th></tr></thead>
                    <tbody>
                      {inventory.map(b => (
                        <tr key={b.batchNumber} style={styles.tableRow}>
                          <td style={{padding: '10px'}}><QRCodeDisplay value={b.batchNumber} size={60} showActions={true} /></td>
                          <td style={{fontWeight: 700}}>{b.productName}</td>
                          <td>{b.batchNumber}</td>
                          <td>{b.price} {b.currency}</td>
                          <td><span style={{...styles.badge, background: '#f0fdf4', color: '#10b981'}}>{b.quantity} units</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'sale' && (
                <div className="glass-panel" style={{maxWidth: '900px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                    <h3 style={{margin: 0, fontSize: '1.2rem'}}>Multi-Item Point of Sale</h3>
                    <button onClick={() => { setScannerTarget('cart'); setIsScannerOpen(true); }} className="btn btn-outline" style={{display: 'flex', alignItems: 'center', gap: '0.5rem', borderColor: '#10b981', color: '#10b981'}}>
                      <Icons.Scanner /> Scan Medicine
                    </button>
                  </div>
                  <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2.5rem'}}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>1. Customer Identifier</label>
                      <input type="text" style={styles.input} placeholder="e.g. Ali Haider / Prescription #123" value={customerName} onChange={e => setCustomerName(e.target.value)} required />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>2. Add to Basket</label>
                      <div style={{display: 'flex', gap: '0.5rem'}}>
                        <select style={styles.input} value={selectedBatch} onChange={e => setSelectedBatch(e.target.value)}>
                          <option value="">-- Choose Medicine --</option>
                          {inventory.filter(b => Number(b.quantity) > 0 && !cart.find(c => c.batchNumber === b.batchNumber)).map(b => (
                            <option key={b.batchNumber} value={b.batchNumber}>{b.productName} ({b.batchNumber})</option>
                          ))}
                        </select>
                        <button onClick={addToCart} className="btn btn-outline" style={{borderColor: '#10b981', color: '#10b981'}}>Add</button>
                      </div>
                    </div>
                  </div>

                  {cart.length > 0 && (
                    <div style={{marginBottom: '2rem'}}>
                      <h4 style={{fontSize: '0.9rem', color: '#64748b', marginBottom: '1rem'}}>Basket Summary</h4>
                      <table style={styles.table}>
                        <thead><tr style={styles.tableHeader}><th>Item</th><th>Qty</th><th>Price</th><th>Total</th><th></th></tr></thead>
                        <tbody>
                          {cart.map(item => (
                            <tr key={item.batchNumber} style={styles.tableRow}>
                              <td><div style={{fontWeight: 700}}>{item.productName}</div><div style={{fontSize: '0.7rem'}}>{item.batchNumber}</div></td>
                              <td><input type="number" style={{...styles.input, padding: '4px 8px', width: '80px'}} value={item.quantity} onChange={e => updateCartItem(item.batchNumber, 'quantity', e.target.value)} /></td>
                              <td>{item.price} {item.currency}</td>
                              <td>{Number(item.quantity || 0) * Number(item.price)} {item.currency}</td>
                              <td><button onClick={() => removeFromCart(item.batchNumber)} style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer'}}><Icons.Trash /></button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{textAlign: 'right', marginTop: '1.5rem', fontSize: '1.1rem', fontWeight: 800}}>Grand Total: {cart.reduce((sum, item) => sum + (Number(item.quantity || 0) * Number(item.price)), 0)} {cart[0]?.currency}</div>
                      <button onClick={handleCheckout} className="btn btn-primary" style={{marginTop: '2rem', width: '100%'}}>Finalize Sale & Generate Receipt</button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'invoice' && lastInvoice && (
                <div className="glass-panel">
                  <div ref={invoiceRef} style={{padding: '40px', background: 'white', border: '1px solid #e2e8f0'}}>
                     <div style={{textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #10b981', paddingBottom: '15px'}}>
                        <h2 style={{margin: 0, color: '#10b981'}}>PHARMACY SALES RECEIPT</h2>
                        <p style={{fontSize: '0.8rem', color: '#64748b'}}>MediTrace Blockchain Verified Authenticity</p>
                     </div>
                     <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '30px', fontSize: '0.9rem'}}>
                        <div>
                           <strong>PHARMACY:</strong><br/>{entityName}<br/><span style={{fontSize: '0.75rem', color: '#64748b'}}>{account}</span><br/><br/>
                           <strong>CUSTOMER:</strong><br/>{lastInvoice.customer}
                        </div>
                        <div style={{textAlign: 'right'}}><strong>DATE:</strong><br/>{lastInvoice.date}<br/><strong>RECEIPT #:</strong> RC-{Math.floor(Math.random()*100000)}</div>
                     </div>
                     <table style={{width: '100%', borderCollapse: 'collapse', marginBottom: '20px'}}>
                        <thead><tr style={{borderBottom: '2px solid #0f172a', textAlign: 'left', fontSize: '0.8rem'}}><th style={{padding: '10px'}}>Item</th><th>Qty</th><th>Price</th><th style={{textAlign: 'right'}}>Subtotal</th></tr></thead>
                        <tbody>
                          {lastInvoice.items.map((item, idx) => (
                            <tr key={idx} style={{borderBottom: '1px solid #f1f5f9'}}><td style={{padding: '10px'}}>{item.productName}<br/><span style={{fontSize: '0.6rem'}}>Batch: {item.batchNumber}</span></td><td>{item.quantity}</td><td>{item.price}</td><td style={{textAlign: 'right'}}>{item.total} {item.currency}</td></tr>
                          ))}
                        </tbody>
                     </table>
                     <div style={{textAlign: 'right', fontSize: '1.3rem', fontWeight: 800}}>TOTAL: {lastInvoice.grandTotal} {lastInvoice.currency}</div>
                     <div style={{marginTop: '50px', borderTop: '1px solid #e2e8f0', paddingTop: '15px', fontSize: '0.7rem', color: '#94a3b8', textAlign: 'center'}}>
                        Thank you for choosing a MediTrace verified pharmacy. Scan the batch QR code on your medicine to verify its entire journey from manufacturer to your hand.
                     </div>
                  </div>
                  <div style={{display: 'flex', gap: '1rem', marginTop: '2rem'}}>
                    <button onClick={printInvoice} className="btn btn-primary">Print Receipt</button>
                    <button onClick={() => setActiveTab('sale')} className="btn btn-outline">New Sale</button>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="glass-panel">
                  <h3 style={styles.panelTitle}>Sales Ledger</h3>
                  <table style={styles.table}>
                    <thead><tr style={styles.tableHeader}><th>Date</th><th>Medicine</th><th>Qty</th><th>Total</th></tr></thead>
                    <tbody>
                      {saleHistory.map(s => (
                        <tr key={s.saleId.toString()} style={styles.tableRow}>
                          <td>{new Date(Number(s.soldAt) * 1000).toLocaleDateString()}</td>
                          <td>{s.productName}</td>
                          <td>{s.quantity.toString()}</td>
                          <td style={{fontWeight: 700}}>{(Number(s.quantity) * Number(s.pricePerUnit))} {s.currency}</td>
                        </tr>
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
  sidebarBrand: { padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', color: 'white', fontWeight: 800, fontSize: '1.4rem' },
  roleTag: { color: '#94a3b8', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' },
  nav: { flex: 1, padding: '0 1rem' },
  navItem: { display: 'flex', alignItems: 'center', padding: '0.8rem 1rem', borderRadius: '8px', cursor: 'pointer', color: '#94a3b8', marginBottom: '4px' },
  navItemActive: { background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' },
  navCount: { background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px', fontWeight: 700 },
  sidebarFooter: { padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' },
  logoutBtn: { width: '100%', padding: '0.6rem', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' },
  main: { flex: 1, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
  header: { height: '70px', background: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 },
  headerTitle: { fontSize: '1rem', fontWeight: 800, color: '#0f172a' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer' },
  toast: { background: '#f0fdf4', color: '#059669', padding: '4px 12px', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 600 },
  userProfile: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  userName: { color: '#0f172a', fontWeight: 600, fontSize: '0.9rem' },
  content: { padding: '2rem', flex: 1 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' },
  statCard: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', gap: '1rem', alignItems: 'center' },
  statIconContainer: { width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statTitle: { color: '#64748b', fontSize: '0.8rem' },
  statValue: { fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' },
  panelTitle: { fontSize: '1.2rem', color: '#0f172a', marginBottom: '1.5rem', fontWeight: 700 },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { background: '#f8fafc', textAlign: 'left', color: '#64748b', fontSize: '0.7rem', textTransform: 'uppercase', padding: '12px' },
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  badge: { padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { fontSize: '0.8rem', fontWeight: 700, color: '#475569' },
  input: { padding: '0.7rem', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' },
  loadingContainer: { textAlign: 'center', padding: '5rem', color: '#64748b' }
};
