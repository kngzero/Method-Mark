import React from 'react'
import Slide, { createBlock } from './components/Slide.jsx'
import BlockToolbar from './components/BlockToolbar.jsx'
import Checklist from './components/Checklist.jsx'
import { BLOCK_TYPES } from './constants.js'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { parseColor } from './utils/color.js'
import { computeGrid } from './utils/grid.js'

const DEFAULT_A4 = { w: 794, h: 1123 };     // px approximation
const DEFAULT_169 = { w: 1600, h: 900 };    // px

export default function App() {
  const [format, setFormat] = React.useState('A4'); // 'A4' | '16x9'
  const [brandName, setBrandName] = React.useState('Your Brand');
  const [slides, setSlides] = React.useState([
    { id:'s1', blocks: [] }
  ]);
  const [active, setActive] = React.useState('s1');
  const slideRefs = React.useRef({});

  const dim = format === 'A4' ? DEFAULT_A4 : DEFAULT_169;
  const [snap, setSnap] = React.useState(true);
  const [gridSettings, setGridSettings] = React.useState({ margin:40, gutter:8 });
  const grid = computeGrid(format, dim.w, dim.h, gridSettings);

  const addSlide = () => {
    const id = 's'+(slides.length+1);
    setSlides([...slides, { id, blocks: [] }]);
    setActive(id);
  };

  const setSlideBlocks = (id, blocks) => {
    setSlides(slides.map(s => s.id===id?{...s, blocks}:s));
  };

  const saveJSON = () => {
    const blob = new Blob([JSON.stringify({ brandName, format, slides }, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'method-mark.json';
    a.click();
  };
  const loadJSON = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        if (obj.slides) {
          setBrandName(obj.brandName || 'Brand');
          setFormat(obj.format || 'A4');
          setSlides(obj.slides);
          setActive(obj.slides[0]?.id || 's1');
        }
      } catch(e) { alert('Invalid JSON'); }
    };
    reader.readAsText(file);
  };

  const exportPDF = async () => {
    const pages = [];
    for (const s of slides) {
      const node = slideRefs.current[s.id];
      if (!node) continue;
      const canvas = await html2canvas(node, { backgroundColor: '#ffffff', scale: 2 });
      pages.push(canvas.toDataURL('image/png'));
    }
    // PDF size in px units
    const firstDim = [dim.w, dim.h];
    const pdf = new jsPDF({ unit: 'px', format: firstDim, orientation: dim.w > dim.h ? 'l' : 'p' });
    pages.forEach((url, i) => {
      if (i>0) pdf.addPage(firstDim, dim.w > dim.h ? 'l' : 'p');
      pdf.addImage(url, 'PNG', 0, 0, dim.w, dim.h);
    });
    pdf.save(`${brandName.replace(/\s+/g,'_')}_Brand_Guide.pdf`);
  };

  const [palette, setPalette] = React.useState(['hsl(0 0% 10%)', 'hsl(0 0% 40%)', 'hsl(0 0% 70%)']);
  const addPaletteColor = (value) => {
    const res = parseColor(value);
    if (res.ok) setPalette([...palette, res.rgbString]);
    else alert('Invalid color: '+ value + '\n' + (res.message||''));
  };

  // Checklist state
  const [manualChecks, setManualChecks] = React.useState({});
  const autoChecks = React.useMemo(() => {
    const res = {};
    for (const it of BLOCK_TYPES) {
      res[it] = slides.some(s => (s.blocks || []).some(b => b.type === it));
    }
    return res;
  }, [slides]);
  const handleManualChange = (item, checked) => {
    setManualChecks({ ...manualChecks, [item]: checked });
  };

  const addBlock = (type, extra) => {
    const blk = createBlock(type, grid, extra);
    setSlides(slides.map(s => s.id===active?{...s, blocks:[...(s.blocks||[]), blk]}:s));
  };

  return (
    <div className="app">
      <div>
        <div className="toolbar">
          <div className="row">
            <input type="text" value={brandName} onChange={e=>setBrandName(e.target.value)} placeholder="Brand name" />
            <select className="btn" value={format} onChange={e=>setFormat(e.target.value)}>
              <option value="A4">A4 (portrait)</option>
              <option value="16x9">16×9 (landscape)</option>
            </select>
            <button className="btn" onClick={addSlide}>+ Slide</button>
            <button className="btn" onClick={exportPDF}>Export PDF</button>
            <button className="btn" onClick={saveJSON}>Save JSON</button>
            <label className="btn">
              Load JSON
              <input type="file" accept="application/json" style={{ display:'none' }} onChange={e => e.target.files[0] && loadJSON(e.target.files[0])} />
            </label>
          </div>
        </div>

        {/* Canvas area */}
        <div className="canvasArea" style={{ display:'flex', gap:16, padding:16 }}>
          <BlockToolbar onAdd={addBlock} />
          <div className="canvasWrap">
            {slides.map(s => (
              <div key={s.id} onClick={()=>setActive(s.id)} style={{ border: s.id===active?'2px solid #888':'2px solid transparent', borderRadius:10, padding:6, background:'#f0f0f0' }}>
                <div
                  className="slide"
                  ref={el => (slideRefs.current[s.id] = el)}
                  style={{ width: dim.w, height: dim.h }}
                >
                  <div style={{ position:'absolute', left:16, top:12, color:'#333', fontWeight:600, fontSize:14 }}>{brandName}</div>
                  <Slide blocks={s.blocks || []} grid={grid} snap={snap} onChange={b=>setSlideBlocks(s.id,b)} />
                  <div style={{ position:'absolute', left:16, bottom:12, display:'flex', gap:8 }}>
                    {palette.map((c,i)=> <div key={i} title={c} className="swatch" style={{ background:c }} />)}
                  </div>
                </div>
                <div className="row" style={{ justifyContent:'space-between', marginTop:6 }}>
                  <span className="small">Slide: {s.id}</span>
                  <button className="btn" onClick={()=>setSlides(slides.filter(x=>x.id!==s.id))}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <aside className="panel">
        <div className="row" style={{ marginBottom:12 }}>
          <label>Margin <input type="number" value={gridSettings.margin} onChange={e=>setGridSettings({...gridSettings, margin:parseInt(e.target.value)||0})} style={{ width:60 }} /></label>
          <label>Gutter <input type="number" value={gridSettings.gutter} onChange={e=>setGridSettings({...gridSettings, gutter:parseInt(e.target.value)||0})} style={{ width:60 }} /></label>
        </div>
        <div className="row" style={{ marginBottom:12 }}>
          <label><input type="checkbox" checked={snap} onChange={e=>setSnap(e.target.checked)} /> Snap to grid</label>
        </div>
        <div className="row">
          <input placeholder="Add color (#, rgb, hsl, oklch)" onKeyDown={(e)=>{
            if (e.key==='Enter') addPaletteColor(e.currentTarget.value)
          }} />
          <button className="btn" onClick={()=>{
            const val = prompt('Enter a color (#rgb, rgb(), hsl(), oklch())');
            if (val) addPaletteColor(val);
          }}>+ Add</button>
        </div>
        <div style={{ marginTop:12 }}>
          <div className="label">Palette</div>
          <div className="palette">
            {palette.map((c,i)=>(
              <div key={i} title={c} className="swatch" style={{ background:c }} />
            ))}
          </div>
        </div>
        <div style={{ marginTop:24 }}>
          <Checklist items={BLOCK_TYPES} auto={autoChecks} manual={manualChecks} onManualChange={handleManualChange} />
        </div>
      </aside>
    </div>
  );
}