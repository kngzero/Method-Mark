import React from 'react'
import { sanitizeColor } from '../utils/color.js'

let idCounter = 1;
const newId = () => 'item_' + idCounter++;

export default function FreeformBoard({ data, onUpdate }) {
  const boardRef = React.useRef(null);

  const addImage = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      const item = { id: newId(), type: 'image', url, x: 40, y: 40, w: 240, h: 180 };
      onUpdate({ ...data, items: [...(data.items || []), item] });
    };
    reader.readAsDataURL(file);
  };

  const addSwatch = (value) => {
    const s = sanitizeColor(value);
    if (s.ok) {
      const item = { id: newId(), type: 'swatch', value: s.value, x: 60, y: 60, size: 80 };
      onUpdate({ ...data, items: [...(data.items || []), item] });
    } else {
      alert('Invalid color: ' + value + '\n' + (s.message || ''));
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) addImage(file);
  };

  const onDragOver = (e) => e.preventDefault();

  const updateItem = (id, patch) => {
    const items = (data.items || []).map(it => it.id === id ? { ...it, ...patch } : it);
    onUpdate({ ...data, items });
  };

  const removeItem = (id) => {
    const items = (data.items || []).filter(it => it.id !== id);
    onUpdate({ ...data, items });
  };

  return (
    <div
      ref={boardRef}
      className="freeBoard"
      style={{ position:'relative', width:'100%', height:'100%', background:'#fafafa', overflow:'hidden' }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {(data.items || []).map(it => (
        <DraggableItem key={it.id} item={it} onChange={patch => updateItem(it.id, patch)} onRemove={() => removeItem(it.id)} />
      ))}

      <Toolbar onAddImage={(file)=>addImage(file)} onAddSwatch={(val)=>addSwatch(val)} />
    </div>
  );
}

function Toolbar({ onAddImage, onAddSwatch }) {
  const fileRef = React.useRef(null);
  const [color, setColor] = React.useState('oklch(62% 0.19 244)');

  const pick = () => fileRef.current?.click();
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) onAddImage(f);
  };

  return (
    <div style={{ position:'absolute', right:12, top:12, background:'#111c', color:'#fff', padding:8, borderRadius:8, display:'flex', gap:8, alignItems:'center' }}>
      <button className="btn" onClick={pick}>+ Image</button>
      <input type="file" ref={fileRef} style={{ display:'none' }} accept="image/*" onChange={onFile} />
      <input value={color} onChange={e=>setColor(e.target.value)} placeholder="hex/rgb/hsl/oklch" style={{ padding:'6px 8px', width:200 }} />
      <button className="btn" onClick={()=>onAddSwatch(color)}>+ Swatch</button>
    </div>
  );
}

function DraggableItem({ item, onChange, onRemove }) {
  const ref = React.useRef(null);
  const dragging = React.useRef(false);
  const resizing = React.useRef(false);
  const start = React.useRef({ x:0, y:0, w:0, h:0, left:0, top:0 });

  const onMouseDown = (e) => {
    dragging.current = true;
    start.current = { x: e.clientX, y: e.clientY, w: item.w, h: item.h, left: item.x, top: item.y };
    e.preventDefault();
  };
  const onMouseMove = (e) => {
    if (dragging.current) {
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      onChange({ x: start.current.left + dx, y: start.current.top + dy });
    } else if (resizing.current) {
      const dx = e.clientX - start.current.x;
      const dy = e.clientY - start.current.y;
      onChange({ w: Math.max(40, start.current.w + dx), h: Math.max(40, start.current.h + dy) });
    }
  };
  const onMouseUp = () => { dragging.current = false; resizing.current = false; };
  const onResizeDown = (e) => {
    resizing.current = true;
    start.current = { x: e.clientX, y: e.clientY, w: item.w || 80, h: item.h || 80, left: 0, top: 0 };
    e.stopPropagation(); e.preventDefault();
  };

  React.useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  });

  return (
    <div
      ref={ref}
      className="item"
      style={{ left:item.x, top:item.y, width:item.w || item.size, height:item.h || item.size, boxShadow:'0 0 0 1px #0003, 0 8px 20px #0002', background:'#fff' }}
      onMouseDown={onMouseDown}
    >
      {item.type === 'image' && <img src={item.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
      {item.type === 'swatch' && <div style={{ width:'100%', height:'100%', background:item.value }} />}
      <div className="handle" onMouseDown={onResizeDown}>⤡</div>
      <button onClick={onRemove} style={{ position:'absolute', right:6, top:6, background:'#0007', color:'#fff', border:'none', borderRadius:4, padding:'2px 6px', cursor:'pointer' }}>×</button>
    </div>
  );
}