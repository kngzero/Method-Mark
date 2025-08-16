import React from 'react';
import styles from './ColorSwatch.module.css';

export default function ColorSwatch({ color, label }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.colorBlock} style={{ backgroundColor: color || '#ccc' }} />
      {label && <span className={styles.label}>{label}</span>}
    </div>
  );
}
