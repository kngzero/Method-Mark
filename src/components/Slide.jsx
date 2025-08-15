import React from 'react';
import GridOverlay from './GridOverlay.jsx';
import { IMAGE_BLOCKS } from '../constants.js';
import TextBox from './TextBox.jsx';
import ImageBlock from './ImageBlock.jsx';
import ColorSwatch from './ColorSwatch.jsx';
import ColorPaletteBlock from './ColorPaletteBlock.jsx';

const snapPos = (v, step, margin) => Math.round((v - margin) / step) * step + margin;
const snapSize = (v, step, gutter) => {
  const span = Math.max(1, Math.round((v + gutter) / step));
  return span * step - gutter;
};

let idCounter = 1;
const newId = () => 'blk_' + idCounter++;

export default function Slide({
  blocks,
  onChange,
  grid,
  snap,
  boardPadding,
  roundedCorners,
  softShadow,
  showSafeMargin,
  backgroundColor
}) {
  const updateBlock = (id, patch) => {
    const next = blocks.map(b => (b.id === id ? { ...b, ...patch } : b));
    onChange(next);
  };
  const removeBlock = (id) => {
    const next = blocks.filter(b => b.id !== id);
    onChange(next);
  };

  return (
    <div
      className="slideCanvas"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        padding: boardPadding,
        boxSizing: 'border-box',
        background: backgroundColor,
        borderRadius: roundedCorners ? 12 : 0,
        boxShadow: softShadow ? '0 0 0 1px #0003, 0 8px 20px #0002' : '0 0 0 1px #0003'
      }}
    >
      {blocks.map(b => (
        <DraggableBlock key={b.id} block={b} grid={grid} snap={snap} onChange={p=>updateBlock(b.id,p)} onRemove={()=>removeBlock(b.id)} />
      ))}
      {showSafeMargin && (
        <div style={{ position: 'absolute', inset: 0, border: '2px dashed #f00', pointerEvents: 'none' }} />
      )}
      <GridOverlay grid={grid} />
    </div>
  );
}

function DraggableBlock({ block, onChange, onRemove, grid, snap }) {
  const ref = React.useRef(null);
  const dragging = React.useRef(false);
  const resizing = React.useRef(false);
  const start = React.useRef({ x:0, y:0, w:0, h:0, left:0, top:0 });

  const onMouseDown = (e) => {
    dragging.current = true;
    start.current = { x: e.clientX, y: e.clientY, w: block.w, h: block.h, left: block.x, top: block.y };
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
  const onMouseUp = () => {
    if (dragging.current || resizing.current) {
      const { stepX, stepY, margin, gutter } = grid;
      if (snap) {
        const snapped = {
          x: snapPos(block.x, stepX, margin),
          y: snapPos(block.y, stepY, margin),
          w: snapSize(block.w, stepX, gutter),
          h: snapSize(block.h, stepY, gutter)
        };
        onChange(snapped);
      }
    }
    dragging.current = false;
    resizing.current = false;
  };
  const onResizeDown = (e) => {
    resizing.current = true;
    start.current = { x: e.clientX, y: e.clientY, w: block.w, h: block.h, left: 0, top: 0 };
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
      style={{ position: 'absolute', left: block.x, top: block.y, width: block.w, height: block.h, background: '#fff', boxShadow: '0 0 0 1px #0003, 0 8px 20px #0002', cursor: 'grab' }}
      onMouseDown={onMouseDown}
    >
      {IMAGE_BLOCKS.includes(block.type) ? (
        block.url && <ImageBlock url={block.url} alt={block.type} />
      ) : block.type === 'color-swatch' ? (
        <ColorSwatch color={block.color} label={block.label} />
      ) : block.type === 'colors' ? (
        <ColorPaletteBlock colors={block.colors || []} />
      ) : (
        <TextBox text={block.text || block.type} onChange={text => onChange({ text })} />
      )}
      <div className="handle" onMouseDown={onResizeDown}>⤡</div>
      <button
        onClick={onRemove}
        style={{ position: 'absolute', right: 6, top: 6, background: '#eee', color: '#333', border: '1px solid #ccc', borderRadius: 4, padding: '2px 6px', cursor: 'pointer' }}
      >
        ×
      </button>
    </div>
  );
}

export function createBlock(type, grid, extra = {}) {
  const { margin, stepX, stepY, gutter } = grid;
  const w = snapSize(200, stepX, gutter);
  const h = snapSize(80, stepY, gutter);
  return { id:newId(), type, x:margin, y:margin, w, h, ...extra };
}
