import React from 'react'
import Slide, { createBlock } from './components/Slide.jsx'
import { BLOCK_TYPES } from './constants.js'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { GRID_PRESETS, computeGrid } from './utils/grid.js'

function StatusDot({ done }) {
  return <span className={`statusDot${done ? ' done' : ''}`} />;
}

const DEFAULT_A4 = { w: 794, h: 1123 };     // px approximation
const DEFAULT_169 = { w: 1600, h: 900 };    // px

export default function App() {
  const [format, setFormat] = React.useState('A4'); // 'A4' | '16x9'
  const [brandName, setBrandName] = React.useState('Your Brand');
  const [tagline, setTagline] = React.useState('');
  const [mission, setMission] = React.useState('');
  const [vision, setVision] = React.useState('');
  const [value, setValue] = React.useState('');
  const [story, setStory] = React.useState('');
  const [headingFont, setHeadingFont] = React.useState('');
  const [bodyFont, setBodyFont] = React.useState('');
  const [colorsList, setColorsList] = React.useState([
    { name:'Primary', value:'#111827' },
    { name:'Accent', value:'#4F46E5' },
    { name:'Neutral', value:'#5E5E7A' }
  ]);
  const [slides, setSlides] = React.useState([
    { id:'s1', blocks: [] }
  ]);
  const [active, setActive] = React.useState('s1');
  const slideRefs = React.useRef({});
  const logoRef = React.useRef(null);

  const dim = format === 'A4' ? DEFAULT_A4 : DEFAULT_169;
    const [snap, setSnap] = React.useState(true);
    const [gridSettings, setGridSettings] = React.useState(() => ({ ...GRID_PRESETS['A4'] }));
    const grid = computeGrid(format, dim.w, dim.h, gridSettings);

    React.useEffect(() => {
      setGridSettings({ ...GRID_PRESETS[format] });
    }, [format]);

    const addSlide = () => {
      const id = 's'+(slides.length+1);
      setSlides([...slides, { id, blocks: [] }]);
      setActive(id);
    };

    const duplicateSlide = (s) => {
      const id = 's'+(slides.length+1);
      const blocks = JSON.parse(JSON.stringify(s.blocks || []));
      setSlides([...slides, { id, blocks }]);
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

  const autoChecks = React.useMemo(() => {
    const res = {};
    for (const it of BLOCK_TYPES) {
      res[it] = slides.some(s => (s.blocks || []).some(b => b.type === it));
    }
    return res;
  }, [slides]);
  const addBlock = (type, extra) => {
    const blk = createBlock(type, grid, extra);
    setSlides(slides.map(s => s.id===active?{...s, blocks:[...(s.blocks||[]), blk]}:s));
  };
  const addTextBlock = (type, text) => {
    addBlock(type, { text });
  };
  const addColorsBlock = () => {
    const text = colorsList.map(c => `${c.name}: ${c.value}`).join('\n');
    addBlock('colors', { text });
  };
  const addTypographyBlock = () => {
    const text = `Heading: ${headingFont}\nBody: ${bodyFont}`;
    addBlock('typography', { text });
  };
  const onLogoFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      addBlock('logo', { url: reader.result });
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };
  const loadFont = (name) => {
    if (!name) return;
    const id = 'font-' + name.replace(/\s+/g, '-');
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/\s+/g,'+')}&display=swap`;
    document.head.appendChild(link);
  };
  const updateColor = (i, field, val) => {
    setColorsList(colorsList.map((c,idx)=>idx===i?{...c,[field]:val}:c));
  };
  const removeColor = (i) => {
    setColorsList(colorsList.filter((_,idx)=>idx!==i));
  };
  const addColorRow = () => {
    setColorsList([...colorsList, { name:'', value:'' }]);
  };

  const [leftOpen, setLeftOpen] = React.useState(true);
  const [rightOpen, setRightOpen] = React.useState(true);

    return (
      <div className="app">
        <header className="header">
          <div className="row" style={{ gap:12 }}>
            <strong>Method Mark</strong>
          </div>
          <div className="row">
            <button className="btn" onClick={addSlide}>+ Add Slide</button>
            <button className="btn" onClick={saveJSON}>Save</button>
            <label className="btn">
              Load
              <input type="file" accept="application/json" style={{ display:'none' }} onChange={e => e.target.files[0] && loadJSON(e.target.files[0])} />
            </label>
            <button className="btn" onClick={()=>alert('Method Mark')}>About</button>
          </div>
        </header>
        <div className="workspace" style={{ paddingLeft:leftOpen?220:20, paddingRight:rightOpen?220:20, boxSizing:'border-box' }}>
          {leftOpen ? (
            <aside className="side left">
              <div className="drawerToggle" onClick={()=>setLeftOpen(false)}>◀</div>
              <h2 style={{ marginTop:0 }}>Content</h2>
              <div className="row" style={{ marginBottom:12 }}>
                <select className="btn" value={format} onChange={e=>setFormat(e.target.value)}>
                  <option value="A4">A4 (portrait)</option>
                  <option value="16x9">16×9 (landscape)</option>
                </select>
              </div>
              <section style={{ marginBottom:16 }}>
                <h3 style={{ margin:0, marginBottom:8 }}>Brand Basics</h3>
                <div className="row" style={{ marginBottom:8 }}>
                  <label style={{ width:80 }}>Brand Name <StatusDot done={autoChecks['name']} /></label>
                  <input type="text" value={brandName} onChange={e=>setBrandName(e.target.value)} style={{ flex:1 }} />
                  <button className="btn" onClick={()=>addTextBlock('name', brandName)}>Add</button>
                </div>
                <div className="row" style={{ marginBottom:8 }}>
                  <label style={{ width:80 }}>Tagline <StatusDot done={autoChecks['tagline']} /></label>
                  <input type="text" value={tagline} onChange={e=>setTagline(e.target.value)} style={{ flex:1 }} />
                  <button className="btn" onClick={()=>addTextBlock('tagline', tagline)}>Add</button>
                </div>
                <div className="row" style={{ marginBottom:8 }}>
                  <label style={{ width:80 }}>Mission <StatusDot done={autoChecks['mission']} /></label>
                  <textarea value={mission} onChange={e=>setMission(e.target.value)} style={{ flex:1 }} />
                  <button className="btn" onClick={()=>addTextBlock('mission', mission)}>Add</button>
                </div>
                <div className="row" style={{ marginBottom:8 }}>
                  <label style={{ width:80 }}>Vision <StatusDot done={autoChecks['vision']} /></label>
                  <input type="text" value={vision} onChange={e=>setVision(e.target.value)} style={{ flex:1 }} />
                  <button className="btn" onClick={()=>addTextBlock('vision', vision)}>Add</button>
                </div>
                <div className="row" style={{ marginBottom:8 }}>
                  <label style={{ width:80 }}>Value <StatusDot done={autoChecks['values']} /></label>
                  <input type="text" value={value} onChange={e=>setValue(e.target.value)} style={{ flex:1 }} />
                  <button className="btn" onClick={()=>addTextBlock('values', value)}>Add</button>
                </div>
                <div className="row" style={{ marginBottom:8 }}>
                  <label style={{ width:80 }}>Brand Story <StatusDot done={autoChecks['story']} /></label>
                  <textarea value={story} onChange={e=>setStory(e.target.value)} style={{ flex:1 }} />
                  <button className="btn" onClick={()=>addTextBlock('story', story)}>Add</button>
                </div>
              </section>
              <section style={{ marginBottom:16 }}>
                <h3 style={{ margin:0, marginBottom:8 }}>Logo <StatusDot done={autoChecks['logo']} /></h3>
                <button className="btn" onClick={()=>logoRef.current?.click()}>Upload</button>
                <input type="file" accept="image/*" ref={logoRef} style={{ display:'none' }} onChange={onLogoFile} />
              </section>
              <section style={{ marginBottom:16 }}>
                <h3 style={{ margin:0, marginBottom:8 }}>Colors <StatusDot done={autoChecks['colors']} /></h3>
                {colorsList.map((c,i)=>(
                  <div className="row" style={{ marginBottom:8 }} key={i}>
                    <input placeholder="Name" value={c.name} onChange={e=>updateColor(i,'name',e.target.value)} style={{ flex:1 }} />
                    <input placeholder="#000000" value={c.value} onChange={e=>updateColor(i,'value',e.target.value)} style={{ width:80 }} />
                    <button className="btn" onClick={()=>removeColor(i)}>x</button>
                  </div>
                ))}
                <button className="btn" onClick={addColorRow}>+ Add Color</button>
                <button className="btn" style={{ marginTop:8 }} onClick={addColorsBlock}>Add Colors Block</button>
              </section>
              <section style={{ marginBottom:16 }}>
                <h3 style={{ margin:0, marginBottom:8 }}>Typography <StatusDot done={autoChecks['typography']} /></h3>
                <div className="row" style={{ marginBottom:8 }}>
                  <label style={{ width:90 }}>Heading Font</label>
                  <input value={headingFont} onChange={e=>{setHeadingFont(e.target.value); loadFont(e.target.value);}} style={{ flex:1 }} />
                </div>
                <div className="row" style={{ marginBottom:8 }}>
                  <label style={{ width:90 }}>Body Font</label>
                  <input value={bodyFont} onChange={e=>{setBodyFont(e.target.value); loadFont(e.target.value);}} style={{ flex:1 }} />
                </div>
                <button className="btn" onClick={addTypographyBlock}>Add Typography Block</button>
              </section>
            </aside>
          ) : (
            <div className="drawerOpener" onClick={()=>setLeftOpen(true)}>▶</div>
          )}

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
                </div>
                <div className="row" style={{ justifyContent:'space-between', marginTop:6 }}>
                  <span className="small">Slide: {s.id}</span>
                  <div className="row">
                    <button className="btn" onClick={()=>duplicateSlide(s)}>Duplicate</button>
                    <button className="btn" onClick={()=>setSlides(slides.filter(x=>x.id!==s.id))}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {rightOpen ? (
            <aside className="side right">
              <div className="drawerToggle" onClick={()=>setRightOpen(false)}>▶</div>
              <h2 style={{ marginTop:0 }}>Settings</h2>
              <div className="row" style={{ marginBottom:12 }}>
                <label style={{ width:60 }}>Margin</label>
                <input type="range" min="0" max="200" value={gridSettings.margin} onChange={e=>setGridSettings({...gridSettings, margin:parseInt(e.target.value)||0})} />
                <input type="number" value={gridSettings.margin} onChange={e=>setGridSettings({...gridSettings, margin:parseInt(e.target.value)||0})} style={{ width:60 }} />
              </div>
              <div className="row" style={{ marginBottom:12 }}>
                <label style={{ width:60 }}>Gutter</label>
                <input type="range" min="0" max="100" value={gridSettings.gutter} onChange={e=>setGridSettings({...gridSettings, gutter:parseInt(e.target.value)||0})} />
                <input type="number" value={gridSettings.gutter} onChange={e=>setGridSettings({...gridSettings, gutter:parseInt(e.target.value)||0})} style={{ width:60 }} />
              </div>
              <div className="row" style={{ marginBottom:12 }}>
                <label style={{ width:60 }}>Columns</label>
                <input type="range" min="1" max="24" value={gridSettings.cols} onChange={e=>setGridSettings({...gridSettings, cols:parseInt(e.target.value)||1})} />
                <input type="number" value={gridSettings.cols} onChange={e=>setGridSettings({...gridSettings, cols:parseInt(e.target.value)||1})} style={{ width:60 }} />
              </div>
              <div className="row" style={{ marginBottom:12 }}>
                <label><input type="checkbox" checked={snap} onChange={e=>setSnap(e.target.checked)} /> Snap to grid</label>
              </div>
            </aside>
          ) : (
            <div className="drawerOpener right" onClick={()=>setRightOpen(true)}>◀</div>
          )}
      </div>
    </div>
  );
}