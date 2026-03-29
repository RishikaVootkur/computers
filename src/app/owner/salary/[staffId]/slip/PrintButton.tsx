'use client'
export default function PrintButton() {
  return (
    <button onClick={() => window.print()}
      style={{ display:'block', margin:'32px auto 0', padding:'10px 32px', background:'#1d4ed8', color:'#fff', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}
      className="print-hide">
      Print Salary Slip
    </button>
  )
}
