import { useState, useEffect } from "react";

const formatAddress = (addr) =>
  `${addr.slice(0, 6)}...${addr.slice(-4)}`;

const formatBalance = (bal) =>
  parseFloat(bal).toFixed(4);

export default function MetaMaskConnect() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [status, setStatus] = useState("idle"); // idle | connecting | connected | error
  const [error, setError] = useState("");

  const NETWORKS = {
    "0x1": "Ethereum Mainnet",
    "0x5": "Goerli Testnet",
    "0xaa36a7": "Sepolia Testnet",
    "0x89": "Polygon",
    "0xa": "Optimism",
    "0xa4b1": "Arbitrum One",
  };

  const getBalance = async (address) => {
    const raw = await window.ethereum.request({
      method: "eth_getBalance",
      params: [address, "latest"],
    });
    const eth = parseInt(raw, 16) / 1e18;
    setBalance(eth.toString());
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("MetaMask not detected. Please install the extension.");
      setStatus("error");
      return;
    }
    try {
      setStatus("connecting");
      setError("");
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const chain = await window.ethereum.request({ method: "eth_chainId" });
      setAccount(accounts[0]);
      setChainId(chain);
      await getBalance(accounts[0]);
      setStatus("connected");
    } catch (err) {
      setError(err.message || "Connection rejected.");
      setStatus("error");
    }
  };

  const disconnect = () => {
    setAccount(null);
    setBalance(null);
    setChainId(null);
    setStatus("idle");
    setError("");
  };

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        await getBalance(accounts[0]);
      }
    };

    const handleChainChanged = (chain) => {
      setChainId(chain);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  const networkName = NETWORKS[chainId] || (chainId ? `Chain ${parseInt(chainId, 16)}` : null);
  const isConnected = status === "connected";

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.foxIcon}>🦊</div>
          <h1 style={styles.title}>MetaMask</h1>
          <p style={styles.subtitle}>Connect your wallet to get started</p>
        </div>

        {/* Status Pill */}
        <div style={{
          ...styles.statusPill,
          background: isConnected ? "#d1fae5" : status === "error" ? "#fee2e2" : "#f1f5f9",
          color: isConnected ? "#065f46" : status === "error" ? "#991b1b" : "#64748b",
        }}>
          <span style={{
            ...styles.dot,
            background: isConnected ? "#10b981" : status === "error" ? "#ef4444" : "#94a3b8",
            boxShadow: isConnected ? "0 0 0 3px #a7f3d0" : "none",
          }} />
          {isConnected ? "Connected" : status === "connecting" ? "Connecting…" : status === "error" ? "Failed" : "Disconnected"}
        </div>

        {/* Connected Info */}
        {isConnected && account && (
          <div style={styles.infoBox}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Address</span>
              <span style={styles.infoValue}>{formatAddress(account)}</span>
            </div>
            {balance !== null && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Balance</span>
                <span style={styles.infoValue}>{formatBalance(balance)} ETH</span>
              </div>
            )}
            {networkName && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Network</span>
                <span style={styles.infoValue}>{networkName}</span>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {status === "error" && error && (
          <div style={styles.errorBox}>
            ⚠️ {error}
          </div>
        )}

        {/* Action Button */}
        {!isConnected ? (
          <button
            style={{
              ...styles.btn,
              ...(status === "connecting" ? styles.btnDisabled : styles.btnPrimary),
            }}
            onClick={connectWallet}
            disabled={status === "connecting"}
          >
            {status === "connecting" ? (
              <span style={styles.spinner}>⏳ Connecting…</span>
            ) : (
              "Connect Wallet"
            )}
          </button>
        ) : (
          <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={disconnect}>
            Disconnect
          </button>
        )}

        <p style={styles.footnote}>
          {!window.ethereum
            ? <>Don't have MetaMask? <a href="https://metamask.io" target="_blank" rel="noreferrer" style={styles.link}>Install it here →</a></>
            : "By connecting, you agree to MetaMask's terms of use."}
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
    fontFamily: "'Georgia', serif",
    padding: "24px",
  },
  card: {
    background: "#fff",
    borderRadius: "20px",
    padding: "40px 36px",
    width: "100%",
    maxWidth: "400px",
    boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px",
  },
  header: {
    textAlign: "center",
  },
  foxIcon: {
    fontSize: "48px",
    display: "block",
    marginBottom: "8px",
  },
  title: {
    margin: "0 0 6px",
    fontSize: "26px",
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: "-0.5px",
  },
  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#94a3b8",
  },
  statusPill: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "6px 16px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "600",
    fontFamily: "monospace",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    display: "inline-block",
    transition: "all 0.3s",
  },
  infoBox: {
    width: "100%",
    background: "#f8fafc",
    borderRadius: "12px",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    border: "1px solid #e2e8f0",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: "12px",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    color: "#94a3b8",
    fontFamily: "monospace",
  },
  infoValue: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#1e293b",
    fontFamily: "monospace",
  },
  errorBox: {
    width: "100%",
    background: "#fff1f2",
    border: "1px solid #fecdd3",
    color: "#9f1239",
    borderRadius: "10px",
    padding: "12px 16px",
    fontSize: "13px",
    lineHeight: "1.5",
  },
  btn: {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.2s",
    letterSpacing: "0.02em",
  },
  btnPrimary: {
    background: "#f97316",
    color: "#fff",
    boxShadow: "0 4px 14px rgba(249,115,22,0.4)",
  },
  btnSecondary: {
    background: "#f1f5f9",
    color: "#64748b",
  },
  btnDisabled: {
    background: "#e2e8f0",
    color: "#94a3b8",
    cursor: "not-allowed",
  },
  spinner: {
    display: "inline-block",
  },
  footnote: {
    fontSize: "12px",
    color: "#94a3b8",
    textAlign: "center",
    margin: 0,
    lineHeight: "1.6",
  },
  link: {
    color: "#f97316",
    textDecoration: "none",
    fontWeight: "600",
  },
};
