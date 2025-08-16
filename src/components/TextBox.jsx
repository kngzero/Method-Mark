import React from 'react';
import styles from './TextBox.module.css';

export default function TextBox({ text, onChange, fontFamily }) {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      className={styles.textBox}
      style={{ fontFamily }}
      onBlur={e => onChange && onChange(e.target.innerText)}
    >
      {text}
    </div>
  );
}
