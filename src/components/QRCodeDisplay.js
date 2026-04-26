import React, { useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const QRCodeDisplay = ({ value, size = 128, label, showActions = false }) => {
  const qrRef = useRef();

  const downloadQR = () => {
    const canvas = qrRef.current.querySelector('canvas');
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    let downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `MediTrace-QR-${value}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const printQR = () => {
    const canvas = qrRef.current.querySelector('canvas');
    const dataUrl = canvas.toDataURL();
    const windowContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Print Batch QR</title>
        <style>
          body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
          .label { margin-top: 20px; font-weight: bold; font-size: 1.2rem; color: #10b981; }
          .batch { margin-top: 5px; color: #64748b; }
        </style>
      </head>
      <body onload="window.print(); window.close();">
        <img src="${dataUrl}" width="300" height="300" />
        <div class="label">MediTrace Verified Batch</div>
        <div class="batch">${value}</div>
      </body>
      </html>
    `;
    const printWindow = window.open('', '', 'width=600,height=600');
    printWindow.document.open();
    printWindow.document.write(windowContent);
    printWindow.document.close();
  };

  return (
    <div style={styles.container} ref={qrRef}>
      <div style={styles.qrWrapper}>
        <QRCodeCanvas 
          value={value} 
          size={size}
          level="H"
          includeMargin={true}
        />
      </div>
      {label && <p style={styles.label}>{label}</p>}
      
      {showActions && (
        <div style={styles.actions}>
          <button onClick={downloadQR} style={styles.actionBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download
          </button>
          <button onClick={printQR} style={styles.actionBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
            Print
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '1rem',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    width: 'fit-content'
  },
  qrWrapper: {
    padding: '10px',
    border: '1px solid #f1f5f9',
    borderRadius: '8px',
    background: 'white'
  },
  label: {
    marginTop: '8px',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'center'
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem',
    width: '100%'
  },
  actionBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '6px 0',
    fontSize: '0.7rem',
    fontWeight: 700,
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    background: 'white',
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

export default QRCodeDisplay;
