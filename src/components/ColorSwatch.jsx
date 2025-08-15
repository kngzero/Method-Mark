import React from 'react';

export default function ColorSwatch({ color, label }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', height: '100%', padding: 8, boxSizing: 'border-box' }}>
      <div style={{ backgroundColor: color || '#ccc', width: '100%', height: '60%', border: '1px solid #999', borderRadius: 4 }} />
      {label && <span style={{ marginTop: 4, fontSize: 12 }}>{label}</span>}
    </div>
  );
}
