import React from 'react';
import GridOverlay from './GridOverlay.jsx';
import { IMAGE_BLOCKS } from '../constants.js';
import TextBox from './TextBox.jsx';
import ImageBlock from './ImageBlock.jsx';
import ColorSwatch from './ColorSwatch.jsx';
import ColorPaletteBlock from './ColorPaletteBlock.jsx';
import styles from './Slide.module.css';

const snapPos = (v, step, margin, safeMargin, size, max) => {
  const snapped = Math.round((v - margin) / step) * step + margin;
  const min = margin + safeMargin;
  const maxVal = max - margin - safeMargin - size;
  return Math.min(Math.max(snapped, min), maxVal);
};
const snapSize = (v, step, gutter) => {
  const span = Math.max(1, Math.round((v + gutter) / step));
  return span * step - gutter;
};

let idCounter = 1;
const newId = () => 'blk_' + idCounter++;

const HEADING_TYPES = new Set(['name', 'tagline']);

export default function Slide({
    blocks,
    onChange,
    grid,
    snap,
    slideMargin,
    showSafeMargin,
    backgroundColor,
    headingFont,
    bodyFont,
    zoom = 1
  }) {
  const [selectedId, setSelectedId] = React.useState(null);
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
        className={`slideCanvas ${styles.slideCanvas}`}
        onMouseDown={e => { if (e.target === e.currentTarget) setSelectedId(null); }}
        style={{ padding: slideMargin, background: backgroundColor }}
      >
        {blocks.map(b => (
          <DraggableBlock
            key={b.id}
            block={b}
            grid={grid}
            snap={snap}
            selected={selectedId === b.id}
            onSelect={() => setSelectedId(b.id)}
            onChange={p => updateBlock(b.id, p)}
            onRemove={() => removeBlock(b.id)}
            fontFamily={b.fontFamily || (HEADING_TYPES.has(b.type) ? headingFont : bodyFont)}
            zoom={zoom}
          />
        ))}
      <GridOverlay grid={grid} showSafeMargin={showSafeMargin} />
    </div>
  );
}

  function DraggableBlock({ block, onChange, onRemove, grid, snap, selected, onSelect, fontFamily, zoom = 1 }) {
  const ref = React.useRef(null);
  const dragging = React.useRef(false);
  const resizing = React.useRef(false);
  const start = React.useRef({ x:0, y:0, w:0, h:0, left:0, top:0 });

  const onMouseDown = (e) => {
    dragging.current = true;
    start.current = { x: e.clientX, y: e.clientY, w: block.w, h: block.h, left: block.x, top: block.y };
    onSelect();
    ref.current && ref.current.focus();
    e.preventDefault();
  };
  const onMouseMove = (e) => {
      const { margin, safeMargin, width, height } = grid;
      if (dragging.current) {
        const dx = (e.clientX - start.current.x) / zoom;
        const dy = (e.clientY - start.current.y) / zoom;
      const x = Math.min(
        Math.max(start.current.left + dx, margin + safeMargin),
        width - margin - safeMargin - block.w
      );
      const y = Math.min(
        Math.max(start.current.top + dy, margin + safeMargin),
        height - margin - safeMargin - block.h
      );
      onChange({ x, y });
      } else if (resizing.current) {
        const dx = (e.clientX - start.current.x) / zoom;
        const dy = (e.clientY - start.current.y) / zoom;
        onChange({ w: Math.max(40, start.current.w + dx), h: Math.max(40, start.current.h + dy) });
      }
  };
  const onMouseUp = () => {
    if (dragging.current || resizing.current) {
      const { stepX, stepY, margin, gutter, width, height } = grid;
      if (snap) {
        const w = snapSize(block.w, stepX, gutter);
        const h = snapSize(block.h, stepY, gutter);
        const x = snapPos(block.x, stepX, margin, 0, w, width);
        const y = snapPos(block.y, stepY, margin, 0, h, height);
        onChange({ x, y, w, h });
      } else {
        const x = Math.min(
          Math.max(block.x, margin),
          width - margin - block.w
        );
        const y = Math.min(
          Math.max(block.y, margin),
          height - margin - block.h
        );
        onChange({ x, y });
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

  const onKeyDown = (e) => {
    const { stepX, stepY, margin, safeMargin, width, height } = grid;
    let x = block.x;
    let y = block.y;
    let w = block.w;
    let h = block.h;
    let handled = false;
    if (e.key === 'ArrowLeft') {
      handled = true;
      if (e.shiftKey) {
        w = Math.max(stepX, w - stepX);
      } else {
        x -= stepX;
      }
    } else if (e.key === 'ArrowRight') {
      handled = true;
      if (e.shiftKey) {
        w = Math.min(width - margin - safeMargin - x, w + stepX);
      } else {
        x += stepX;
      }
    } else if (e.key === 'ArrowUp') {
      handled = true;
      if (e.shiftKey) {
        h = Math.max(stepY, h - stepY);
      } else {
        y -= stepY;
      }
    } else if (e.key === 'ArrowDown') {
      handled = true;
      if (e.shiftKey) {
        h = Math.min(height - margin - safeMargin - y, h + stepY);
      } else {
        y += stepY;
      }
    }
    if (handled) {
      e.preventDefault();
      x = Math.min(Math.max(x, margin + safeMargin), width - margin - safeMargin - w);
      y = Math.min(Math.max(y, margin + safeMargin), height - margin - safeMargin - h);
      onChange({ x, y, w, h });
    }
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
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={onSelect}
        className={`${styles.block} ${selected ? styles.selected : ''}`}
        style={{ left: block.x, top: block.y, width: block.w, height: block.h }}
        onMouseDown={onMouseDown}
      >
      {IMAGE_BLOCKS.includes(block.type) ? (
        block.url && <ImageBlock url={block.url} alt={block.type} />
      ) : block.type === 'color-swatch' ? (
        <ColorSwatch color={block.color} label={block.label} />
      ) : block.type === 'colors' ? (
        <ColorPaletteBlock colors={block.colors || []} />
      ) : (
        <TextBox text={block.text || block.type} fontFamily={fontFamily} onChange={text => onChange({ text })} />
      )}
      <div className="handle" onMouseDown={onResizeDown}>⤡</div>
        <button onClick={onRemove} className={styles.removeButton}>
          ×
        </button>
      </div>
  );
}

export function createBlock(type, grid, extra = {}) {
  const { margin, safeMargin, stepX, stepY, gutter, width, height } = grid;
  const w = snapSize(extra.w ?? 200, stepX, gutter);
  const h = snapSize(extra.h ?? 80, stepY, gutter);
  let x = extra.x ?? margin + safeMargin;
  let y = extra.y ?? margin + safeMargin;
  x = Math.min(Math.max(x, margin), width - margin - w);
  y = Math.min(Math.max(y, margin), height - margin - h);
  return { id: newId(), type, ...extra, w, h, x, y };
}
