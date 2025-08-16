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
  const imageryRef = React.useRef(null);
  const iconRef = React.useRef(null);
  const genericImageRef = React.useRef(null);
  const [voiceTone, setVoiceTone] = React.useState('');
  const [genericText, setGenericText] = React.useState('');
  const [genericColorName, setGenericColorName] = React.useState('');
  const [genericColorValue, setGenericColorValue] = React.useState('#000000');

  const dim = format === 'A4' ? DEFAULT_A4 : DEFAULT_169;
  const [snap, setSnap] = React.useState(true);
  const [gridSettings, setGridSettings] = React.useState(() => {
    const { margin, ...rest } = GRID_PRESETS['A4'];
    return rest;
  });
  const [slideMargin, setSlideMargin] = React.useState(GRID_PRESETS['A4'].margin);
  const [showSafeMargin, setShowSafeMargin] = React.useState(false);
  const [backgroundColor, setBackgroundColor] = React.useState('#ffffff');
  const [exportFormat, setExportFormat] = React.useState('png');
  // History stack for undo/redo
  const history = React.useRef([]);
  const future = React.useRef([]);
  const restoring = React.useRef(false);

  const getSnapshot = () =>
    JSON.parse(
      JSON.stringify({
        format,
        brandName,
        tagline,
        mission,
        vision,
        value,
        story,
        headingFont,
        bodyFont,
        colorsList,
        slides,
        active,
        voiceTone,
        genericText,
        genericColorName,
        genericColorValue,
        snap,
        gridSettings,
        slideMargin,
        showSafeMargin,
        backgroundColor,
      })
    );

  const restore = (s) => {
    setFormat(s.format);
    setBrandName(s.brandName);
    setTagline(s.tagline);
    setMission(s.mission);
    setVision(s.vision);
    setValue(s.value);
    setStory(s.story);
    setHeadingFont(s.headingFont);
    setBodyFont(s.bodyFont);
    setColorsList(s.colorsList);
    setSlides(s.slides);
    setActive(s.active);
    setVoiceTone(s.voiceTone);
    setGenericText(s.genericText);
    setGenericColorName(s.genericColorName);
    setGenericColorValue(s.genericColorValue);
    setSnap(s.snap);
    setGridSettings(s.gridSettings);
    setSlideMargin(s.slideMargin);
    setShowSafeMargin(s.showSafeMargin);
    setBackgroundColor(s.backgroundColor);
  };

  const undo = () => {
    if (history.current.length <= 1) return;
    const current = history.current.pop();
    future.current.push(current);
    const prev = history.current[history.current.length - 1];
    restoring.current = true;
    restore(prev);
  };

  const redo = () => {
    const next = future.current.pop();
    if (!next) return;
    history.current.push(next);
    restoring.current = true;
    restore(next);
  };

  React.useEffect(() => {
    if (restoring.current) {
      restoring.current = false;
      return;
    }
    history.current.push(getSnapshot());
    future.current = [];
  }, [
    format,
    brandName,
    tagline,
    mission,
    vision,
    value,
    story,
    headingFont,
    bodyFont,
    colorsList,
    slides,
    active,
    voiceTone,
    genericText,
    genericColorName,
    genericColorValue,
    snap,
    gridSettings,
    slideMargin,
    showSafeMargin,
    backgroundColor,
  ]);

  React.useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const grid = computeGrid(
    format,
    dim.w,
    dim.h,
    { ...gridSettings, margin: slideMargin }
  );

  React.useEffect(() => {
    const { margin, ...rest } = GRID_PRESETS[format];
    setGridSettings(rest);
    setSlideMargin(margin);
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

    const moveSlide = (from, to) => {
      setSlides(prev => {
        const updated = [...prev];
        const [item] = updated.splice(from, 1);
        updated.splice(to, 0, item);
        return updated;
      });
    };

    const moveSlideUp = (i) => {
      if (i > 0) moveSlide(i, i - 1);
    };

    const moveSlideDown = (i) => {
      if (i < slides.length - 1) moveSlide(i, i + 1);
    };

    const onDragStartSlide = (i) => (e) => {
      e.dataTransfer.setData('text/plain', i);
      e.dataTransfer.effectAllowed = 'move';
    };

    const onDropSlide = (i) => (e) => {
      e.preventDefault();
      const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
      if (!isNaN(from) && from !== i) {
        moveSlide(from, i);
      }
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

  const saveImage = React.useCallback(async () => {
    const node = slideRefs.current[active];
    if (!node) return;
    node.classList.add('exporting');
    const canvas = await html2canvas(node, { backgroundColor, scale: 2 });
    node.classList.remove('exporting');
    const mime = exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
    const link = document.createElement('a');
    link.download = `${brandName.replace(/\s+/g,'_')}.${exportFormat}`;
    link.href = canvas.toDataURL(mime);
    link.click();
  }, [active, backgroundColor, brandName, exportFormat]);

  const exportPDF = async () => {
    const pages = [];
    for (const s of slides) {
      const node = slideRefs.current[s.id];
      if (!node) continue;
      node.classList.add('exporting');
      const canvas = await html2canvas(node, { backgroundColor, scale: 2 });
      node.classList.remove('exporting');
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

  React.useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        saveImage();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveImage]);

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
  const headingTypes = React.useMemo(() => new Set(['name', 'tagline']), []);
  const addTextBlock = (type, text) => {
    const fontFamily = headingTypes.has(type) ? headingFont : bodyFont;
    addBlock(type, { text, fontFamily });
  };
  const addColorsBlock = () => {
    addBlock('colors', { colors: colorsList });
  };
  const addTypographyBlock = () => {
    const text = `Heading: ${headingFont}\nBody: ${bodyFont}`;
    addBlock('typography', { text, fontFamily: bodyFont });
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
  const onImageryFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      addBlock('imagery', { url: reader.result });
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };
  const onIconFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      addBlock('iconography', { url: reader.result });
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };
  const onGenericImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      addBlock('image', { url: reader.result });
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };
  const addVoiceToneBlock = () => {
    addTextBlock('voice & tone', voiceTone);
  };
  const addGenericTextBlock = () => {
    addTextBlock('textbox', genericText);
    setGenericText('');
  };
  const addGenericSwatch = () => {
    addBlock('color-swatch', { label: genericColorName, color: genericColorValue });
    setGenericColorName('');
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

  const deleteSlide = (id) => {
    if (!window.confirm('Delete this slide?')) return;
    // store previous state for potential undo
    undoStack.current.push(slides);
    redoStack.current = [];
    setSlides(slides.filter(x => x.id !== id));
  };

    return (
      <div className="app">
          <header className="header">
            <div className="row" style={{ gap:12 }}>
              <strong>Method Mark</strong>
            </div>
            <div className="row">
              <button className="btn" onClick={undo} disabled={history.current.length <= 1}>Undo</button>
              <button className="btn" onClick={redo} disabled={future.current.length === 0}>Redo</button>
              <button className="btn" onClick={addSlide}>+ Add Slide</button>
              <button className="btn" onClick={()=>alert('Method Mark')}>About</button>
            </div>
          </header>
        <div className="workspace" style={{ paddingLeft:leftOpen?220:20, paddingRight:rightOpen?220:20, boxSizing:'border-box' }}>
          {leftOpen ? (
            <aside className="side left">
              <button
                type="button"
                className="drawerToggle"
                aria-label="Close content panel"
                onClick={() => setLeftOpen(false)}
              >
                ◀
              </button>
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
                  <label style={{  }}>Brand Name <StatusDot done={autoChecks['name']} /></label>
                  <input type="text" value={brandName} onChange={e=>setBrandName(e.target.value)} style={{ flex:1 }} />
                  <button className="btn" onClick={()=>addTextBlock('name', brandName)}>Add</button>
                </div>
                <div className="row" style={{ marginBottom:8 }}>
                  <label style={{  }}>Tagline <StatusDot done={autoChecks['tagline']} /></label>
                  <input type="text" value={tagline} onChange={e=>setTagline(e.target.value)} style={{ flex:1 }} />
                  <button className="btn" onClick={()=>addTextBlock('tagline', tagline)}>Add</button>
                </div>
                <div className="row" style={{ marginBottom:8 }}>
                  <label style={{  }}>Mission <StatusDot done={autoChecks['mission']} /></label>
                  <textarea value={mission} onChange={e=>setMission(e.target.value)} style={{ flex:1 }} />
                  <button className="btn" onClick={()=>addTextBlock('mission', mission)}>Add</button>
                </div>
                <div className="row" style={{ marginBottom:8 }}>
                  <label style={{  }}>Vision <StatusDot done={autoChecks['vision']} /></label>
                  <input type="text" value={vision} onChange={e=>setVision(e.target.value)} style={{ flex:1 }} />
                  <button className="btn" onClick={()=>addTextBlock('vision', vision)}>Add</button>
                </div>
                <div className="row" style={{ marginBottom:8 }}>
                  <label style={{  }}>Value <StatusDot done={autoChecks['values']} /></label>
                  <input type="text" value={value} onChange={e=>setValue(e.target.value)} style={{ flex:1 }} />
                  <button className="btn" onClick={()=>addTextBlock('values', value)}>Add</button>
                </div>
                <div className="row" style={{ marginBottom:8 }}>
                  <label style={{  }}>Brand Story <StatusDot done={autoChecks['story']} /></label>
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
                    <input placeholder="#000000" value={c.value} onChange={e=>updateColor(i,'value',e.target.value)} style={{  }} />
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
              <section style={{ marginBottom:16 }}>
                <h3 style={{ margin:0, marginBottom:8 }}>Imagery & Iconography</h3>
                <div className="row" style={{ marginBottom:8 }}>
                  <button className="btn" onClick={()=>imageryRef.current?.click()}>Add Imagery</button>
                  <input type="file" accept="image/*" ref={imageryRef} style={{ display:'none' }} onChange={onImageryFile} />
                </div>
                <div className="row" style={{ marginBottom:8 }}>
                  <button className="btn" onClick={()=>iconRef.current?.click()}>Add Icon</button>
                  <input type="file" accept="image/*" ref={iconRef} style={{ display:'none' }} onChange={onIconFile} />
                </div>
              </section>
              <section style={{ marginBottom:16 }}>
                <h3 style={{ margin:0, marginBottom:8 }}>Voice & Tone <StatusDot done={autoChecks['voice & tone']} /></h3>
                <textarea value={voiceTone} onChange={e=>setVoiceTone(e.target.value)} style={{ width:'100%', marginBottom:8 }} />
                <button className="btn" onClick={addVoiceToneBlock}>Add</button>
              </section>
              <section style={{ marginBottom:16 }}>
                <h3 style={{ margin:0, marginBottom:8 }}>Generic Components</h3>
                <div className="row" style={{ marginBottom:8 }}>
                  <input placeholder="Text" value={genericText} onChange={e=>setGenericText(e.target.value)} style={{ flex:1 }} />
                  <button className="btn" onClick={addGenericTextBlock}>Add Text</button>
                </div>
                <div className="row" style={{ marginBottom:8 }}>
                  <label className="btn" style={{ flex:1, textAlign:'center' }}>
                    Add Image
                    <input type="file" accept="image/*" ref={genericImageRef} style={{ display:'none' }} onChange={onGenericImage} />
                  </label>
                </div>
                <div className="row" style={{ marginBottom:8 }}>
                  <input placeholder="Label" value={genericColorName} onChange={e=>setGenericColorName(e.target.value)} style={{ flex:1 }} />
                  <input type="color" value={genericColorValue} onChange={e=>setGenericColorValue(e.target.value)} />
                  <button className="btn" onClick={addGenericSwatch}>Add Swatch</button>
                </div>
              </section>
            </aside>
          ) : (
            <button
              type="button"
              className="drawerOpener"
              aria-label="Open content panel"
              onClick={() => setLeftOpen(true)}
            >
              ▶
            </button>
          )}

          <div className="canvasWrap">
            {slides.map((s, i) => (
              <div
                key={s.id}
                onClick={() => setActive(s.id)}
                onDragOver={e => e.preventDefault()}
                onDrop={onDropSlide(i)}
                style={{ border: s.id===active?'2px solid #888':'2px solid transparent', borderRadius:10, padding:6, background:'#f0f0f0' }}
              >
                <div
                  className="slide"
                  ref={el => (slideRefs.current[s.id] = el)}
                  style={{ width: dim.w, height: dim.h }}
                >
                  <div style={{ position:'absolute', left:16, top:12, color:'#333', fontWeight:600, fontSize:14 }}>{brandName}</div>
                  <Slide
                    blocks={s.blocks || []}
                    grid={grid}
                    snap={snap}
                    slideMargin={slideMargin}
                    showSafeMargin={showSafeMargin}
                    backgroundColor={backgroundColor}
                    onChange={b=>setSlideBlocks(s.id,b)}
                    headingFont={headingFont}
                    bodyFont={bodyFont}
                  />
                </div>
                <div className="row" style={{ justifyContent:'space-between', marginTop:6 }}>
                  <span className="small">Slide: {s.id}</span>
                  <div className="row" style={{ gap:4 }}>
                    <button
                      className="btn"
                      draggable
                      onDragStart={onDragStartSlide(i)}
                      aria-label="Drag to reorder"
                      style={{ cursor:'grab' }}
                    >
                      ☰
                    </button>
                    <button className="btn" onClick={()=>moveSlideUp(i)} aria-label="Move slide up">↑</button>
                    <button className="btn" onClick={()=>moveSlideDown(i)} aria-label="Move slide down">↓</button>
                    <button className="btn" onClick={()=>duplicateSlide(s)}>Duplicate</button>
                    <button className="btn" onClick={() => deleteSlide(s.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {rightOpen ? (
            <aside className="side right">
              <button
                type="button"
                className="drawerToggle"
                aria-label="Close settings panel"
                onClick={() => setRightOpen(false)}
              >
                ▶
              </button>
              <h2 style={{ marginTop:0 }}>Settings</h2>
              <div className="row" style={{ marginBottom:12 }}>
                <label style={{  }}>Columns</label>
                <input type="range" min="1" max="24" value={gridSettings.cols} onChange={e=>setGridSettings({...gridSettings, cols:parseInt(e.target.value)||1})} />
                <input type="number" value={gridSettings.cols} onChange={e=>setGridSettings({...gridSettings, cols:parseInt(e.target.value)||1})} style={{ width:60 }} />
              </div>
              <div className="row" style={{ marginBottom:12 }}>
                <label style={{  }}>Rows</label>
                <input type="range" min="1" max="24" value={gridSettings.rows} onChange={e=>setGridSettings({...gridSettings, rows:parseInt(e.target.value)||1})} />
                <input type="number" value={gridSettings.rows} onChange={e=>setGridSettings({...gridSettings, rows:parseInt(e.target.value)||1})} style={{ width:60 }} />
              </div>
              <div className="row" style={{ marginBottom:12 }}>
                <label style={{  }}>Gaps</label>
                <input type="range" min="0" max="100" value={gridSettings.gutter} onChange={e=>setGridSettings({...gridSettings, gutter:parseInt(e.target.value)||0})} />
                <input type="number" value={gridSettings.gutter} onChange={e=>setGridSettings({...gridSettings, gutter:parseInt(e.target.value)||0})} style={{ width:60 }} />
              </div>
              <div className="row" style={{ marginBottom:12 }}>
                <label style={{  }}>Slide Margins</label>
                <input type="range" min="0" max="200" value={slideMargin} onChange={e=>setSlideMargin(parseInt(e.target.value)||0)} />
                <input type="number" value={slideMargin} onChange={e=>setSlideMargin(parseInt(e.target.value)||0)} style={{ width:60 }} />
              </div>
              <div className="row" style={{ marginBottom:12 }}>
                <label style={{  }}>Safe Margin</label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={gridSettings.safeMargin}
                  onChange={e =>
                    setGridSettings({
                      ...gridSettings,
                      safeMargin: parseInt(e.target.value) || 0
                    })
                  }
                />
                <input
                  type="number"
                  value={gridSettings.safeMargin}
                  onChange={e =>
                    setGridSettings({
                      ...gridSettings,
                      safeMargin: parseInt(e.target.value) || 0
                    })
                  }
                  style={{ width:60 }}
                />
              </div>
              <div className="row" style={{ marginBottom:12 }}>
                <label><input type="checkbox" checked={snap} onChange={e=>setSnap(e.target.checked)} /> Snap to grid</label>
              </div>
              
              <div className="row" style={{ marginBottom:12 }}>
                <label><input type="checkbox" checked={showSafeMargin} onChange={e=>setShowSafeMargin(e.target.checked)} /> Show safe margin</label>
              </div>
              <div className="row" style={{ marginBottom:12 }}>
                <label style={{  }}>Background</label>
                <input type="color" value={backgroundColor} onChange={e=>setBackgroundColor(e.target.value)} />
              </div>

              <section style={{ marginTop:24 }}>
                <h3 style={{ margin:0, marginBottom:8 }}>Project</h3>
                <div className="row" style={{ gap:8 }}>
                  <button className="btn" onClick={saveJSON}>Save</button>
                  <label className="btn">
                    Load
                    <input type="file" accept="application/json" style={{ display:'none' }} onChange={e=>e.target.files[0] && loadJSON(e.target.files[0])} />
                  </label>
                </div>
              </section>

              <section style={{ marginTop:16 }}>
                <h3 style={{ margin:0, marginBottom:8 }}>Export</h3>
                <div className="row" style={{ marginBottom:8, gap:8 }}>
                  <select className="btn" value={exportFormat} onChange={e=>setExportFormat(e.target.value)} style={{ flex:1 }}>
                    <option value="png">PNG</option>
                    <option value="jpeg">JPEG</option>
                  </select>
                  <button className="btn" onClick={saveImage}>Save</button>
                </div>
                <button className="btn" onClick={exportPDF}>Save as PDF</button>
              </section>
            </aside>
          ) : (
            <button
              type="button"
              className="drawerOpener right"
              aria-label="Open settings panel"
              onClick={() => setRightOpen(true)}
            >
              ◀
            </button>
          )}
      </div>
    </div>
  );
}
