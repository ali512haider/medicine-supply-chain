import React, { useState, useEffect, useCallback } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { useNavigate } from 'react-router-dom';

const ROLE_NAMES = { 1: 'Admin', 2: 'Manufacturer', 3: 'Distributor', 4: 'Supplier', 5: 'Pharmacist' };

// --- Professional SVG Icons ---
const Icons = {
  Overview: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
  ),
  Manufacturers: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20V9l4-2 6.7 2.3V20"></path><path d="M12.7 9.3l4.3-1.3 5 2V20"></path><path d="M2 20h20"></path></svg>
  ),
  Distributors: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
  ),
  Suppliers: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
  ),
  Pharmacists: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"></path><path d="m8.5 8.5 7 7"></path></svg>
  ),
  Batches: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"></path><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"></path><path d="m3.3 7 8.7 5 8.7-5"></path><path d="M12 22V12"></path></svg>
  ),
  Alert: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
  ),
  Bell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
  ),
  Trace: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
  ),
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
  ),
  Close: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
  )
};

export default function AdminDashboard() {
  const { contracts, account } = useWeb3();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Data State
  const [stats, setStats] = useState({ mfr: 0, dist: 0, supp: 0, pharm: 0, batches: 0 });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [entities, setEntities] = useState({ manufacturers: [], distributors: [], suppliers: [], pharmacists: [] });
  const [allBatches, setAllBatches] = useState([]);
  const [licenseInputs, setLicenseInputs] = useState({});
  const [actionMsg, setActionMsg] = useState('');
  const [traceBatch, setTraceBatch] = useState('');

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchData = useCallback(async () => {
    if (!contracts.registry || !contracts.product) return;
    setLoading(true);
    setActionMsg('⌛ Loading data...');
    try {
      let allAddresses = [];
      try {
        allAddresses = await contracts.registry.getAllRegistered();
      } catch (e) {
        allAddresses = await contracts.registry.getAllEntities();
      }

      const pending = [];
      const mfrs = [];
      const dists = [];
      const supps = [];
      const pharms = [];

      for (let addr of allAddresses) {
        try {
          const entity = await contracts.registry.getEntity(addr);
          let bCount = 0;
          if (Number(entity.role) === 2 && Number(entity.status) === 2) {
            const mb = await contracts.product.getBatchesByManufacturer(addr);
            bCount = mb.length;
          }

          const data = {
            address: addr, role: Number(entity.role), name: entity.name,
            email: entity.email, location: entity.location, status: Number(entity.status),
            license: entity.licenseNumber, batchCount: bCount
          };

          if (data.status === 1) pending.push(data);
          else if (data.status === 2) {
            if (data.role === 2) mfrs.push(data);
            else if (data.role === 3) dists.push(data);
            else if (data.role === 4) supps.push(data);
            else if (data.role === 5) pharms.push(data);
          }
        } catch (err) { }
      }

      let batchIds = await contracts.product.getAllBatches();
      const batches = [];
      for (let bid of batchIds) {
        try {
          const b = await contracts.product.getBatch(bid);
          if (b.exists) batches.push(b);
        } catch (err) { }
      }

      setPendingRequests(pending);
      setEntities({ manufacturers: mfrs, distributors: dists, suppliers: supps, pharmacists: pharms });
      setAllBatches(batches);
      setStats({
        mfr: mfrs.length, dist: dists.length, supp: supps.length, pharm: pharms.length, batches: batches.length
      });
      setActionMsg('');
    } catch (err) {
      console.error(err);
      setActionMsg('❌ Connection Error');
    } finally {
      setLoading(false);
    }
  }, [contracts.registry, contracts.product]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApprove = async (address) => {
    const lic = licenseInputs[address]?.trim();
    if (!lic) { setActionMsg('❌ License required'); return; }
    try {
      setActionMsg('⏳ Approving...');
      const tx = await contracts.registry.approveEntity(address, lic);
      await tx.wait();
      setActionMsg('✅ Approved');
      fetchData();
    } catch (err) { setActionMsg('❌ Error'); }
  };

  const handleNavItemClick = (tab) => {
    setActiveTab(tab);
    if (isMobile) setSidebarOpen(false);
  };

  // --- RENDERING ---

  const renderOverview = () => (
    <div style={styles.grid}>
      <StatCard title="Manufacturers" value={stats.mfr} Icon={Icons.Manufacturers} color="#10b981" />
      <StatCard title="Distributors" value={stats.dist} Icon={Icons.Distributors} color="#3b82f6" />
      <StatCard title="Suppliers" value={stats.supp} Icon={Icons.Suppliers} color="#f59e0b" />
      <StatCard title="Pharmacists" value={stats.pharm} Icon={Icons.Pharmacists} color="#8b5cf6" />
      <StatCard title="Total Batches" value={stats.batches} Icon={Icons.Batches} color="#06b6d4" />
      <StatCard title="Pending Requests" value={pendingRequests.length} Icon={Icons.Bell} color="#ef4444" />
    </div>
  );

  return (
    <div style={styles.adminWrapper}>
      {/* Sidebar Overlay for Mobile */}
      {isMobile && sidebarOpen && (
        <div style={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div style={{
        ...styles.sidebar,
        left: sidebarOpen ? '0' : '-280px',
        width: '280px'
      }}>
        <div style={styles.sidebarBrand}>
          <span style={{ color: '#10b981' }}>MediChain</span> Admin
        </div>
        <nav style={styles.nav}>
          <NavItem active={activeTab === 'overview'} onClick={() => handleNavItemClick('overview')} Icon={Icons.Overview} label="Overview" />
          <NavItem active={activeTab === 'approvals'} onClick={() => handleNavItemClick('approvals')} Icon={Icons.Bell} label="Approvals" count={pendingRequests.length} />
          <NavItem active={activeTab === 'manufacturers'} onClick={() => handleNavItemClick('manufacturers')} Icon={Icons.Manufacturers} label="Manufacturers" />
          <NavItem active={activeTab === 'distributors'} onClick={() => handleNavItemClick('distributors')} Icon={Icons.Distributors} label="Distributors" />
          <NavItem active={activeTab === 'suppliers'} onClick={() => handleNavItemClick('suppliers')} Icon={Icons.Suppliers} label="Suppliers" />
          <NavItem active={activeTab === 'pharmacists'} onClick={() => handleNavItemClick('pharmacists')} Icon={Icons.Pharmacists} label="Pharmacists" />
          <div style={styles.navDivider}>Products</div>
          <NavItem active={activeTab === 'expired'} onClick={() => handleNavItemClick('expired')} Icon={Icons.Alert} label="Expired Goods" />
          <NavItem active={activeTab === 'recalled'} onClick={() => handleNavItemClick('recalled')} Icon={Icons.Alert} label="Recalled Batches" />
          <NavItem active={activeTab === 'trace'} onClick={() => handleNavItemClick('trace')} Icon={Icons.Trace} label="Trace Product" />
        </nav>
      </div>

      {/* Main Content */}
      <div style={{
        ...styles.main,
        marginLeft: isMobile ? '0' : '280px'
      }}>
        <header style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isMobile && (
              <button onClick={() => setSidebarOpen(!sidebarOpen)} style={styles.iconBtn}>
                <Icons.Menu />
              </button>
            )}
            <div>
              <h1 style={styles.headerTitle}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {actionMsg && <div style={styles.toast}>{actionMsg}</div>}
            <div style={styles.userProfile}>
              <div style={styles.avatar}>{account?.slice(2, 4).toUpperCase()}</div>
              {!isMobile && <span style={styles.userName}>Admin Wallet</span>}
            </div>
          </div>
        </header>

        <div style={styles.content}>
          {loading ? (
            <div style={styles.loadingContainer}>
              <div className="spinner"></div>
              <p>Fetching Blockchain State...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {/* Other views remain same but use lightPanel style */}
              {activeTab === 'approvals' && (
                <div style={styles.lightPanel}>
                  <h3>Pending Registration Requests</h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead style={styles.tableHeader}>
                        <tr><th>Entity Name</th><th>Requested Role</th><th>License Assignment</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {pendingRequests.map(r => (
                          <tr key={r.address} style={styles.tableRow}>
                            <td>{r.name}</td>
                            <td><span style={styles.badge}>{ROLE_NAMES[r.role]}</span></td>
                            <td><input style={styles.inlineInput} placeholder="Assign ID" onChange={e => setLicenseInputs({ ...licenseInputs, [r.address]: e.target.value })} /></td>
                            <td>
                              <button style={styles.btnApprove} onClick={() => handleApprove(r.address)}>Approve</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* Dynamic Entity Lists */}
              {['manufacturers', 'distributors', 'suppliers', 'pharmacists'].includes(activeTab) && (
                <div style={styles.lightPanel}>
                  <h3 style={{ textTransform: 'capitalize' }}>{activeTab} List</h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead style={styles.tableHeader}>
                        <tr><th>Name</th><th>Wallet Address</th><th>License</th>{activeTab === 'manufacturers' && <th>Batches</th>}<th>Location</th></tr>
                      </thead>
                      <tbody>
                        {entities[activeTab].map(e => (
                          <tr key={e.address} style={styles.tableRow}>
                            <td>{e.name}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{e.address.slice(0, 12)}...</td>
                            <td>{e.license}</td>
                            {activeTab === 'manufacturers' && <td style={{ color: '#10b981', fontWeight: 600 }}>{e.batchCount}</td>}
                            <td>{e.location}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === 'trace' && (
                <div style={styles.lightPanel}>
                  <h3>Trace Product Lifecycle</h3>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <input className="form-input" style={{ flex: 1, background: '#fff', color: '#000' }} placeholder="Enter Batch Number (e.g. BATCH-001)" onChange={e => setTraceBatch(e.target.value)} />
                    <button className="btn btn-primary" onClick={() => navigate(`/verify?batch=${traceBatch}`)}>Trace Now</button>
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
    <div style={{ ...styles.statIconContainer, color: color, background: `${color}15` }}>
      <Icon />
    </div>
    <div style={styles.statInfo}>
      <div style={styles.statTitle}>{title}</div>
      <div style={styles.statValue}>{value}</div>
    </div>
  </div>
);

const NavItem = ({ active, onClick, Icon, label, count }) => (
  <div onClick={onClick} style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}>
    <Icon />
    <span style={{ marginLeft: '12px', flex: 1 }}>{label}</span>
    {count > 0 && <span style={styles.navCount}>{count}</span>}
  </div>
);

const styles = {
  adminWrapper: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f1f5f9',
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 2000,
    overflow: 'hidden'
  },
  sidebar: {
    position: 'fixed',
    top: 0, bottom: 0,
    background: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    transition: 'left 0.3s ease',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem 0'
  },
  sidebarOverlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.5)',
    zIndex: 90
  },
  sidebarBrand: {
    fontSize: '1.5rem',
    fontWeight: 800,
    padding: '0 1.5rem 2rem',
    color: '#1e293b'
  },
  nav: { padding: '0 0.75rem' },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.875rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    color: '#64748b',
    fontWeight: 500,
    marginBottom: '4px',
    transition: 'all 0.2s'
  },
  navItemActive: {
    background: '#f1f5f9',
    color: '#10b981'
  },
  navCount: {
    background: '#ef4444',
    color: 'white',
    fontSize: '0.7rem',
    padding: '2px 6px',
    borderRadius: '10px'
  },
  navDivider: {
    padding: '1.5rem 1rem 0.5rem',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#94a3b8',
    textTransform: 'uppercase'
  },
  main: {
    flex: 1,
    height: '100vh',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    height: '70px',
    background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    padding: '0 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    zIndex: 50
  },
  headerTitle: { fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' },
  content: { padding: '2rem' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1.5rem'
  },
  statCard: {
    background: '#fff',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  statIconContainer: {
    width: '40px', height: '40px',
    borderRadius: '8px',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  statTitle: { color: '#075fdaff', fontSize: '0.875rem' },
  statValue: { fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' },
  lightPanel: {
    background: '#fff',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginTop: '1.5rem'
  },
  tableWrapper: { overflowX: 'auto', marginTop: '1rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHeader: { background: '#f8fafc', textAlign: 'left', color: '#64748b', fontSize: '0.8rem' },
  tableRow: { borderBottom: '1px solid #f1f5f9', color: '#334155' },
  badge: { padding: '2px 8px', borderRadius: '12px', background: '#f1f5f9', fontSize: '0.75rem' },
  inlineInput: { padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: '4px', width: '100px' },
  btnApprove: { background: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' },
  userProfile: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  avatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#10b981', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' },
  toast: { background: '#f0fdf4', color: '#166534', padding: '4px 12px', borderRadius: '99px', fontSize: '0.8rem', border: '1px solid #bbf7d0' },
  loadingContainer: { textAlign: 'center', padding: '4rem', color: '#64748b' }
};
