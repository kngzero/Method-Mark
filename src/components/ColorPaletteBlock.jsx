import React from 'react';
import ColorSwatch from './ColorSwatch.jsx';
import styles from './ColorPaletteBlock.module.css';

export default function ColorPaletteBlock({ colors = [] }) {
  return (
    <div className={styles.wrapper}>
      {colors.map((c, i) => (
        <ColorSwatch key={i} color={c.value} label={c.name} />
      ))}
    </div>
  );
}
