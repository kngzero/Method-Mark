import React from 'react';
import { BLOCK_TYPES, IMAGE_BLOCKS } from '../constants.js';

export default function BlockToolbar({ onAdd }) {
  const fileRef = React.useRef(null);
  const pending = React.useRef(null);

  const handleClick = (type) => {
    if (IMAGE_BLOCKS.includes(type)) {
      pending.current = type;
      fileRef.current?.click();
    } else {
      onAdd(type);
    }
  };

  const onFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onAdd(pending.current, { url: reader.result });
      pending.current = null;
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="blockToolbar">
      {BLOCK_TYPES.map(t => (
        <button key={t} className="btn" onClick={()=>handleClick(t)}>{t}</button>
      ))}
      <input type="file" accept="image/*" ref={fileRef} style={{ display:'none' }} onChange={onFile} />
    </div>
  );
}
