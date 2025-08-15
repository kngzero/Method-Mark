import React from 'react'
import BrandBoard from './components/BrandBoard.jsx'
import FreeformBoard from './components/FreeformBoard.jsx'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { parseColor } from './utils/color.js'

const DEFAULT_A4 = { w: 794, h: 1123 };     // px approximation
const DEFAULT_169 = { w: 1600, h: 900 };    // px

export default function App() {
  const [format, setFormat] = React.useState('A4'); // 'A4' | '16x9'
  const [brandName, setBrandName] = React.useState('Your Brand');
  const [slides, setSlides] = React.useState([
    { id:'s1', type:'brand', data:{} },
    { id:'s2', type:'freeform', data:{ items: [] } },
  ]);
  const [active, setActive] = React.useState('s1');
  const slideRefs = React.useRef({});

  const dim = format === 'A4' ? DEFAULT_A4 : DEFAULT_169;

  const addSlide = (type='freeform') => {
    const id = 's'+(slides.length+1);
    setSlides([...slides, { id, type, data: type==='freeform'?{items:[]}:{}}]);
    setActive(id);
  };

  const setSlideData = (id, data) => {
    setSlides(slides.map(s => s.id===id?{...s, data}:s));
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

  // Inspector panel – brand colors input (accept OKLCH)
  const [palette, setPalette] = React.useState(['#111827', 'oklch(62% 0.19 244)', 'hsl(12 80% 60%)']);
  const addPaletteColor = (value) => {
    const res = parseColor(value);
    if (res.ok) setPalette([...palette, res.rgbString]);
    else alert('Invalid color: '+ value + '\n' + (res.message||''));
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
            <button className="btn" onClick={()=>addSlide('brand')}>+ Brand Board</button>
            <button className="btn" onClick={()=>addSlide('freeform')}>+ Freeform Board</button>
            <button className="btn" onClick={exportPDF}>Export PDF</button>
            <button className="btn" onClick={saveJSON}>Save JSON</button>
            <label className="btn">
              Load JSON
              <input type="file" accept="application/json" style={{ display:'none' }} onChange={e => e.target.files[0] && loadJSON(e.target.files[0])} />
            </label>
          </div>
        </div>

        {/* Canvas area */}
        <div className="canvasWrap">
          {slides.map(s => (
            <div key={s.id} onClick={()=>setActive(s.id)} style={{ border: s.id===active?'2px solid #61dafb':'2px solid transparent', borderRadius:10, padding:6, background:'#191a22' }}>
              <div
                className="slide"
                ref={el => (slideRefs.current[s.id] = el)}
                style={{ width: dim.w, height: dim.h }}
              >
                {/* Simple header */}
                <div style={{ position:'absolute', left:16, top:12, color:'#333', fontWeight:600, fontSize:14 }}>{brandName} • {s.type === 'brand' ? 'Brand Board' : 'Freeform Board'}</div>

                {/* Page content */}
                {s.type === 'brand' && <BrandBoard data={s.data} onUpdate={(d)=>setSlideData(s.id, d)} />}
                {s.type === 'freeform' && <FreeformBoard data={s.data} onUpdate={(d)=>setSlideData(s.id, d)} />}

                {/* Footer palette preview */}
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

      {/* Side Panel */}
      <aside className="panel">
        <h3 style={{ marginTop:0 }}>Inspector</h3>
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
        <div style={{ marginTop:24 }} className="small">
          <div>• Drag images or swatches onto the Freeform Board.</div>
          <div>• Click tiles on the Brand Board to add images.</div>
          <div>• Export as PDF in A4 or 16:9.</div>
        </div>
      </aside>
    </div>
  );
}