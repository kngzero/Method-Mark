import React from 'react';
import ColorSwatch from './ColorSwatch.jsx';

export default function ColorPaletteBlock({ colors = [] }) {
  return (
    <div style={{ display: 'flex', gap: 8, width: '100%', height: '100%', padding: 8, boxSizing: 'border-box' }}>
      {colors.map((c, i) => (
        <ColorSwatch key={i} color={c.value} label={c.name} />
      ))}
    </div>
  );
}
