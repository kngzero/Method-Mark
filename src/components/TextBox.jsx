import React from 'react';

export default function TextBox({ text, onChange }) {
  return (
    <div
      contentEditable
      suppressContentEditableWarning
      style={{ width: '100%', height: '100%', padding: 8, boxSizing: 'border-box' }}
      onBlur={e => onChange && onChange(e.target.innerText)}
    >
      {text}
    </div>
  );
}
