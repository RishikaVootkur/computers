'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        display: 'block',
        margin: '24px auto 0',
        padding: '10px 28px',
        background: '#1d4ed8',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 600,
        cursor: 'pointer',
      }}
      className="print-hide"
    >
      Print Receipt
    </button>
  )
}
