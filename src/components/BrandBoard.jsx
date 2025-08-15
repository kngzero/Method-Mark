import React from 'react'
import GridOverlay from './GridOverlay.jsx'

/**
 * A fixed grid brand board (like the screenshot).
 * Users can click a tile to upload an image, or insert a palette (colors).
 */
export default function BrandBoard({ onUpdate, data, grid }) {
  const inputRef = React.useRef(null);
  const [activeSlot, setActiveSlot] = React.useState(null);

  const openFile = (slotKey) => {
    setActiveSlot(slotKey);
    inputRef.current?.click();
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      onUpdate({ ...data, [activeSlot]: { type: 'image', url } });
    };
    reader.readAsDataURL(file);
  };

  const Tile = ({ k, title, style }) => {
    const content = data?.[k];
    return (
      <div className="tile" style={style} onClick={() => openFile(k)}>
        <div className="title">{title}</div>
        {!content && <div className="dropzone">Click to add image</div>}
        {content?.type === 'image' && <img src={content.url} alt={title} />}
      </div>
    );
  };

  // 4-column grid with specific tile spans
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'8px', padding:'12px', height:'100%', boxSizing:'border-box', position:'relative' }}>
      {/* Top: 3 small bars for Brand Colors (we'll map palette on export) */}
      <div className="tile" style={{gridColumn:'1 / 2', height:40, display:'flex', alignItems:'center', justifyContent:'center'}}>Brand Colors</div>
      <div className="tile" style={{gridColumn:'2 / 3', height:40, display:'flex', alignItems:'center', justifyContent:'center'}}>Brand Colors</div>
      <div className="tile" style={{gridColumn:'3 / 4', height:40, display:'flex', alignItems:'center', justifyContent:'center'}}>Brand Colors</div>
      <div style={{gridColumn:'4 / 5'}}></div>

      <Tile k="primaryLogo" title="Primary Logo" style={{ gridColumn:'1 / 3', gridRow:'2 / 4', height: 260 }} />
      <Tile k="pattern" title="Pattern" style={{ gridColumn:'3 / 4', gridRow:'2 / 3', height: 120 }} />
      <Tile k="logoVariation" title="Logo Variation" style={{ gridColumn:'3 / 4', gridRow:'3 / 4', height: 132 }} />
      <Tile k="mockup1" title="Mockup" style={{ gridColumn:'4 / 5', gridRow:'2 / 4', height: 260 }} />

      <Tile k="logoElements" title="Logo Elements" style={{ gridColumn:'1 / 3', gridRow:'4 / 5', height: 160 }} />
      <Tile k="mockup2" title="Mockup" style={{ gridColumn:'3 / 5', gridRow:'4 / 6', height: 260 }} />
      <Tile k="typeface" title="Typeface" style={{ gridColumn:'1 / 2', gridRow:'5 / 6', height: 92 }} />
      <Tile k="brandMark" title="Brand Mark" style={{ gridColumn:'2 / 3', gridRow:'5 / 6', height: 92 }} />

      <input type="file" ref={inputRef} style={{ display:'none' }} accept="image/*" onChange={onFile} />
      {grid && <GridOverlay grid={grid} />}
    </div>
  );
}