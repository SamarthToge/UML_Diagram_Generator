import React, {useCallback, useMemo, useState} from "react";
import {createRoot} from "react-dom/client";
import {
  ReactFlow, Background, Controls, MiniMap, Handle, Position,
  addEdge, useEdgesState, useNodesState, MarkerType
} from "@xyflow/react";
import {
  Plus, Trash2, Code2, Download, RotateCcw, Copy, Check, Search,
  Undo2, Redo2, Link2, Sparkles, Play, BookOpen, Boxes, Settings2,
  ChevronDown, ChevronRight, X, LayoutTemplate, FileCode2, Eye,
  Maximize2, ZoomIn, ZoomOut, Move, CircleHelp, MoreHorizontal
} from "lucide-react";
import "@xyflow/react/dist/style.css";
import "./styles.css";

const uid=(p="id")=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
const deep=v=>JSON.parse(JSON.stringify(v));
const vis={public:"+",private:"-",protected:"#",package:"~"};

const templates={
  student:{
    name:"Student Management",
    classes:[
      {id:"student",name:"Student",packageName:"com.example.model",abstract:false,interface:false,
       fields:[
        {id:"s1",name:"studid",type:"int",visibility:"private",static:false,final:false},
        {id:"s2",name:"name",type:"String",visibility:"public",static:false,final:false},
        {id:"s3",name:"age",type:"int",visibility:"protected",static:false,final:false}],
       methods:[{id:"sm1",name:"learn",returnType:"String",visibility:"public",static:false,abstract:false,params:[]}]},
      {id:"course",name:"Course",packageName:"com.example.model",abstract:false,interface:false,
       fields:[
        {id:"c1",name:"courseId",type:"int",visibility:"private",static:false,final:false},
        {id:"c2",name:"title",type:"String",visibility:"private",static:false,final:false}],
       methods:[{id:"cm1",name:"getTitle",returnType:"String",visibility:"public",static:false,abstract:false,params:[]}]},
      {id:"teacher",name:"Teacher",packageName:"com.example.model",abstract:false,interface:false,
       fields:[{id:"t1",name:"name",type:"String",visibility:"private",static:false,final:false}],
       methods:[{id:"tm1",name:"teach",returnType:"void",visibility:"public",static:false,abstract:false,params:[]}]}
    ],
    positions:{student:{x:80,y:90},course:{x:470,y:270},teacher:{x:470,y:20}},
    edges:[
      {source:"student",target:"course",label:"enrolls in",relation:"association"},
      {source:"teacher",target:"course",label:"teaches",relation:"association"}
    ]
  },
  ecommerce:{
    name:"E-Commerce",
    classes:[
      {id:"customer",name:"Customer",packageName:"com.shop.model",abstract:false,interface:false,
       fields:[{id:"a",name:"id",type:"Long",visibility:"private",static:false,final:false},{id:"b",name:"email",type:"String",visibility:"private",static:false,final:false}],
       methods:[{id:"m",name:"placeOrder",returnType:"Order",visibility:"public",static:false,abstract:false,params:[]}]},
      {id:"order",name:"Order",packageName:"com.shop.model",abstract:false,interface:false,
       fields:[{id:"a2",name:"orderId",type:"Long",visibility:"private",static:false,final:false},{id:"b2",name:"total",type:"double",visibility:"private",static:false,final:false}],
       methods:[{id:"m2",name:"calculateTotal",returnType:"double",visibility:"public",static:false,abstract:false,params:[]}]},
      {id:"product",name:"Product",packageName:"com.shop.model",abstract:false,interface:false,
       fields:[{id:"a3",name:"sku",type:"String",visibility:"private",static:false,final:false},{id:"b3",name:"price",type:"double",visibility:"private",static:false,final:false}],
       methods:[{id:"m3",name:"getPrice",returnType:"double",visibility:"public",static:false,abstract:false,params:[]}]}
    ],
    positions:{customer:{x:60,y:100},order:{x:450,y:100},product:{x:450,y:350}},
    edges:[
      {source:"customer",target:"order",label:"places",relation:"association"},
      {source:"order",target:"product",label:"contains",relation:"composition"}
    ]
  },
  library:{
    name:"Library System",
    classes:[
      {id:"book",name:"Book",packageName:"com.library.model",abstract:false,interface:false,
       fields:[{id:"a",name:"isbn",type:"String",visibility:"private",static:false,final:true},{id:"b",name:"title",type:"String",visibility:"private",static:false,final:false}],
       methods:[{id:"m",name:"borrow",returnType:"boolean",visibility:"public",static:false,abstract:false,params:[]}]},
      {id:"member",name:"Member",packageName:"com.library.model",abstract:false,interface:false,
       fields:[{id:"a2",name:"memberId",type:"int",visibility:"private",static:false,final:true},{id:"b2",name:"name",type:"String",visibility:"private",static:false,final:false}],
       methods:[{id:"m2",name:"borrowBook",returnType:"void",visibility:"public",static:false,abstract:false,params:[{id:"p",name:"book",type:"Book"}]}]},
      {id:"library",name:"Library",packageName:"com.library.model",abstract:false,interface:false,
       fields:[{id:"a3",name:"name",type:"String",visibility:"private",static:false,final:false}],
       methods:[{id:"m3",name:"addBook",returnType:"void",visibility:"public",static:false,abstract:false,params:[{id:"p3",name:"book",type:"Book"}]}]}
    ],
    positions:{book:{x:50,y:80},member:{x:470,y:80},library:{x:260,y:370}},
    edges:[
      {source:"member",target:"book",label:"borrows",relation:"association"},
      {source:"library",target:"book",label:"contains",relation:"aggregation"}
    ]
  }
};

function defaultReturn(t){if(t==="boolean")return"false";if(["byte","short","int","long","float","double"].includes(t))return"0";if(t==="char")return"'\\0'";return"null"}
function ident(v,f="item"){return (v||"").replace(/[^A-Za-z0-9_$]/g,"")||f}
function javaClass(c){
  const pkg=c.packageName?.trim()?`package ${c.packageName.trim()};\n\n`:"";
  const decl=c.interface?`public interface ${ident(c.name,"NewClass")}`:`public ${c.abstract?"abstract ":""}class ${ident(c.name,"NewClass")}`;
  const fields=c.fields.map(f=>`    ${f.visibility==="package"?"":f.visibility} ${f.static?"static ":""}${f.final?"final ":""}${f.type||"Object"} ${ident(f.name,"field")};`).join("\n");
  const methods=c.methods.map(m=>{
    const params=(m.params||[]).map(p=>`${p.type||"Object"} ${ident(p.name,"param")}`).join(", ");
    const prefix=`${m.visibility==="package"?"":m.visibility} ${m.static?"static ":""}${m.returnType||"void"} ${ident(m.name,"method")}(${params})`.trim();
    if(c.interface||m.abstract)return`    ${prefix};`;
    const body=m.returnType==="void"?"":`return ${defaultReturn(m.returnType)};`;
    return`    ${prefix} {\n        ${body}\n    }`;
  }).join("\n\n");
  return `${pkg}${decl} {\n${[fields,methods].filter(Boolean).join("\n\n")}\n}\n`;
}
function edgeStyle(kind){
  const base={type:"smoothstep",markerEnd:{type:MarkerType.ArrowClosed}};
  if(kind==="dependency")return {...base,style:{stroke:"#8a96ac",strokeWidth:1.7,strokeDasharray:"6 5"},markerEnd:{type:MarkerType.Arrow,color:"#8a96ac"}};
  if(kind==="inheritance")return {...base,style:{stroke:"#b3bfd1",strokeWidth:2},markerEnd:{type:MarkerType.ArrowClosed,color:"#b3bfd1"}};
  if(kind==="composition")return {...base,style:{stroke:"#aab6ca",strokeWidth:2.2},markerEnd:{type:MarkerType.ArrowClosed,color:"#aab6ca"}};
  if(kind==="aggregation")return {...base,style:{stroke:"#8996ad",strokeWidth:2}};
  return {...base,style:{stroke:"#77849d",strokeWidth:1.8}};
}

function UmlNode({data}){
  const c=data.classData;if(!c)return null;
  return <div className={`uml-card ${c.interface?"interface":""}`}>
    <Handle type="target" position={Position.Left}/>
    <Handle type="source" position={Position.Right}/>
    <div className="uml-header">
      <span className="stereo">{c.interface?"«interface»":c.abstract?"«abstract»":"class"}</span>
      <div className={c.abstract||c.interface?"italic":""}>{c.name||"NewClass"}</div>
    </div>
    <div className="uml-body">
      <div className="uml-block">
        {c.fields.length?c.fields.map(f=><div key={f.id} className={f.static?"underlined":""}>{vis[f.visibility]}{f.name}: {f.type}</div>):<span className="uml-empty">No attributes</span>}
      </div>
      <div className="uml-block">
        {c.methods.length?c.methods.map(m=><div key={m.id} className={`${m.static?"underlined ":""}${m.abstract?"italic":""}`}>{vis[m.visibility]}{m.name}({(m.params||[]).map(p=>`${p.name}: ${p.type}`).join(", ")}): {m.returnType}</div>):<span className="uml-empty">No methods</span>}
      </div>
    </div>
  </div>
}
const nodeTypes={uml:UmlNode};

function App(){
  const makeProject=(key)=>{
    const t=templates[key];
    const classes=deep(t.classes);
    const nodes=classes.map(c=>({id:c.id,type:"uml",position:t.positions[c.id]||{x:100,y:100},data:{classId:c.id}}));
    const edges=t.edges.map((e,i)=>({id:`edge-${i}`,source:e.source,target:e.target,label:e.label,data:{relation:e.relation,label:e.label},...edgeStyle(e.relation)}));
    return{classes,nodes,edges,name:t.name};
  };
  const starter=makeProject("student");
  const [projectName,setProjectName]=useState(starter.name);
  const [classes,setClasses]=useState(starter.classes);
  const [nodes,setNodes,onNodesChange]=useNodesState(starter.nodes);
  const [edges,setEdges,onEdgesChange]=useEdgesState(starter.edges);
  const [selectedId,setSelectedId]=useState("student");
  const [relation,setRelation]=useState("association");
  const [relationLabel,setRelationLabel]=useState("relates to");
  const [tab,setTab]=useState("code");
  const [search,setSearch]=useState("");
  const [history,setHistory]=useState([]);
  const [future,setFuture]=useState([]);
  const [copied,setCopied]=useState(false);
  const [toast,setToast]=useState("");
  const [showTemplates,setShowTemplates]=useState(false);
  const [showHelp,setShowHelp]=useState(false);
  const [theme,setTheme]=useState("dark");

  const selected=classes.find(c=>c.id===selectedId);
  const classMap=useMemo(()=>Object.fromEntries(classes.map(c=>[c.id,c])),[classes]);
  const displayNodes=useMemo(()=>nodes.map(n=>({...n,data:{...n.data,classData:classMap[n.data.classId]}})),[nodes,classMap]);
  const filtered=classes.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));
  const code=classes.map(javaClass).join("\n");
  const stats={classes:classes.length,relationships:edges.length,attributes:classes.reduce((a,c)=>a+c.fields.length,0),methods:classes.reduce((a,c)=>a+c.methods.length,0)};

  const snapshot=()=>({classes:deep(classes),nodes:deep(nodes),edges:deep(edges)});
  const pushHistory=()=>{setHistory(h=>[...h,snapshot()].slice(-30));setFuture([])};
  const notify=(m)=>{setToast(m);setTimeout(()=>setToast(""),1800)};

  const updateSelected=(patch)=>{if(!selected)return;pushHistory();setClasses(cs=>cs.map(c=>c.id===selectedId?{...c,...patch}:c))}
  const updateMember=(kind,id,patch)=>updateSelected({[kind]:selected[kind].map(x=>x.id===id?{...x,...patch}:x)});

  const addClass=()=>{pushHistory();const id=uid("class");const c={id,name:"NewClass",packageName:"com.example.model",abstract:false,interface:false,fields:[],methods:[]};setClasses(cs=>[...cs,c]);setNodes(ns=>[...ns,{id,type:"uml",position:{x:120+(ns.length%3)*330,y:80+Math.floor(ns.length/3)*260},data:{classId:id}}]);setSelectedId(id);notify("Class added")};
  const deleteClass=()=>{if(!selected)return;pushHistory();setClasses(cs=>cs.filter(c=>c.id!==selectedId));setNodes(ns=>ns.filter(n=>n.data.classId!==selectedId));setEdges(es=>es.filter(e=>e.source!==selectedId&&e.target!==selectedId));setSelectedId(classes.find(c=>c.id!==selectedId)?.id||"");notify("Class deleted")};
  const addField=()=>updateSelected({fields:[...selected.fields,{id:uid("field"),name:"field",type:"String",visibility:"private",static:false,final:false}]});
  const addMethod=()=>updateSelected({methods:[...selected.methods,{id:uid("method"),name:"method",returnType:"void",visibility:"public",static:false,abstract:false,params:[]}]});

  const onConnect=useCallback(params=>{
    if(!params.source||!params.target||params.source===params.target)return;
    pushHistory();
    const label=(relationLabel||relation).trim();
    setEdges(es=>[...es,{...params,id:uid("edge"),label,data:{relation,label},...edgeStyle(relation)}]);
    notify("Relationship added");
  },[relation,relationLabel,classes,nodes,edges]);

  const undo=()=>{const h=history.at(-1);if(!h)return;setFuture(f=>[snapshot(),...f].slice(0,30));setClasses(h.classes);setNodes(h.nodes);setEdges(h.edges);setHistory(x=>x.slice(0,-1));notify("Undid change")};
  const redo=()=>{const f=future[0];if(!f)return;setHistory(h=>[...h,snapshot()].slice(-30));setClasses(f.classes);setNodes(f.nodes);setEdges(f.edges);setFuture(x=>x.slice(1));notify("Redid change")};

  const loadTemplate=(key)=>{
    const p=makeProject(key);pushHistory();setProjectName(p.name);setClasses(p.classes);setNodes(p.nodes);setEdges(p.edges);setSelectedId(p.classes[0].id);setShowTemplates(false);notify(`${p.name} template loaded`);
  };
  const reset=()=>{const p=makeProject("student");setProjectName(p.name);setClasses(p.classes);setNodes(p.nodes);setEdges(p.edges);setSelectedId("student");setHistory([]);setFuture([]);notify("Project reset")};
  const copy=async()=>{try{await navigator.clipboard.writeText(code);setCopied(true);notify("Java source copied");setTimeout(()=>setCopied(false),1400)}catch{}};
  const download=(name,text)=>{const blob=new Blob([text],{type:"text/plain"});const u=URL.createObjectURL(blob);const a=document.createElement("a");a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),800)};
  const exportAll=()=>{classes.forEach((c,i)=>setTimeout(()=>download(`${ident(c.name,"NewClass")}.java`,javaClass(c)),i*80));notify("Java files exported")};

  return <div className={`app ${theme}`}>
    <header className="topbar">
      <div className="brand">
        <div className="brand-icon"><Boxes size={20}/></div>
        <div><div className="brand-name">UML Studio <span>PRO</span></div><div className="brand-sub">Design architecture. Generate Java.</div></div>
      </div>
      <div className="project-name"><span>PROJECT</span><input value={projectName} onChange={e=>setProjectName(e.target.value)}/></div>
      <div className="top-actions">
        <button title="Undo" disabled={!history.length} onClick={undo}><Undo2 size={16}/></button>
        <button title="Redo" disabled={!future.length} onClick={redo}><Redo2 size={16}/></button>
        <div className="vline"/>
        <button onClick={()=>setShowTemplates(true)}><LayoutTemplate size={15}/> Templates</button>
        <button onClick={()=>setShowHelp(true)}><CircleHelp size={15}/> Help</button>
        <button className="primary" onClick={addClass}><Plus size={16}/> Add Class</button>
      </div>
    </header>

    <div className="main-grid">
      <aside className="leftbar">
        <div className="left-head"><span>MODEL</span><button onClick={addClass}><Plus size={16}/></button></div>
        <div className="search"><Search size={14}/><input placeholder="Find a class..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <div className="classes">
          {filtered.map(c=><button className={`class-item ${selectedId===c.id?"active":""}`} key={c.id} onClick={()=>setSelectedId(c.id)}>
            <span className="c-icon">{c.interface?"I":"C"}</span><span>{c.name}</span><small>{c.fields.length+c.methods.length}</small>
          </button>)}
        </div>
        <div className="left-tools">
          <button onClick={()=>setShowTemplates(true)}><Sparkles size={14}/> Start from template</button>
          <button onClick={()=>setShowHelp(true)}><BookOpen size={14}/> UML quick guide</button>
        </div>
        <div className="model-stats">
          <div><b>{stats.classes}</b><span>Classes</span></div><div><b>{stats.relationships}</b><span>Links</span></div>
        </div>
      </aside>

      <section className="canvas">
        <div className="canvas-top">
          <div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{projectName}</strong></div>
          <div className="canvas-actions">
            <button title="Fit diagram"><Maximize2 size={15}/></button>
            <button title="Reset"><RotateCcw size={15} onClick={reset}/></button>
          </div>
        </div>
        <div className="relationship-bar">
          <div className="rel-title"><Link2 size={15}/> CONNECT</div>
          <select value={relation} onChange={e=>setRelation(e.target.value)}>
            <option value="association">Association</option><option value="aggregation">Aggregation</option><option value="composition">Composition</option><option value="inheritance">Inheritance</option><option value="dependency">Dependency</option>
          </select>
          <input value={relationLabel} onChange={e=>setRelationLabel(e.target.value)} placeholder="Relationship label"/>
          <span>Drag between handles to connect</span>
        </div>
        <ReactFlow nodes={displayNodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onNodeClick={(_,n)=>setSelectedId(n.data.classId)} fitView fitViewOptions={{padding:.22}} proOptions={{hideAttribution:true}}>
          <Background gap={25} size={1} color="#252e43"/>
          <Controls showInteractive={false}/>
          <MiniMap pannable zoomable nodeColor="#59667f" maskColor="rgba(7,11,21,.75)"/>
        </ReactFlow>
        <div className="canvas-footer"><span><i/> Live editing</span><span>{stats.classes} classes · {stats.relationships} relationships</span></div>
      </section>

      <aside className="inspector">
        <div className="inspector-head"><span>INSPECTOR</span><Settings2 size={15}/></div>
        {selected?<div className="inspector-scroll">
          <div className="selected-title"><div className="selected-icon">{selected.interface?"I":"C"}</div><div><strong>{selected.name}</strong><span>{selected.interface?"Interface":selected.abstract?"Abstract class":"Class"}</span></div><button onClick={deleteClass}><Trash2 size={14}/></button></div>
          <label className="form-label">Class name<input value={selected.name} onChange={e=>updateSelected({name:e.target.value})}/></label>
          <label className="form-label">Package<input value={selected.packageName} onChange={e=>updateSelected({packageName:e.target.value})}/></label>
          <div className="switches"><label><input type="checkbox" checked={selected.abstract} onChange={e=>updateSelected({abstract:e.target.checked,interface:e.target.checked?false:selected.interface})}/><span/> Abstract</label><label><input type="checkbox" checked={selected.interface} onChange={e=>updateSelected({interface:e.target.checked,abstract:e.target.checked?false:selected.abstract})}/><span/> Interface</label></div>

          <section className="ins-section">
            <div className="section-title"><span>Attributes <em>{selected.fields.length}</em></span><button onClick={addField}><Plus size={13}/> Add</button></div>
            {selected.fields.map(f=><div className="editor-card" key={f.id}>
              <div className="card-line"><select value={f.visibility} onChange={e=>updateMember("fields",f.id,{visibility:e.target.value})}><option value="private">private</option><option value="public">public</option><option value="protected">protected</option><option value="package">package</option></select><button onClick={()=>updateSelected({fields:selected.fields.filter(x=>x.id!==f.id)})}><Trash2 size={12}/></button></div>
              <div className="two"><input value={f.name} onChange={e=>updateMember("fields",f.id,{name:e.target.value})} placeholder="name"/><input value={f.type} onChange={e=>updateMember("fields",f.id,{type:e.target.value})} placeholder="Type"/></div>
              <div className="checks"><label><input type="checkbox" checked={f.static} onChange={e=>updateMember("fields",f.id,{static:e.target.checked})}/> static</label><label><input type="checkbox" checked={f.final} onChange={e=>updateMember("fields",f.id,{final:e.target.checked})}/> final</label></div>
            </div>)}
            {!selected.fields.length&&<div className="empty">No attributes. Add one to define state.</div>}
          </section>

          <section className="ins-section">
            <div className="section-title"><span>Methods <em>{selected.methods.length}</em></span><button onClick={addMethod}><Plus size={13}/> Add</button></div>
            {selected.methods.map(m=><div className="editor-card" key={m.id}>
              <div className="card-line"><select value={m.visibility} onChange={e=>updateMember("methods",m.id,{visibility:e.target.value})}><option value="public">public</option><option value="private">private</option><option value="protected">protected</option><option value="package">package</option></select><button onClick={()=>updateSelected({methods:selected.methods.filter(x=>x.id!==m.id)})}><Trash2 size={12}/></button></div>
              <div className="two"><input value={m.name} onChange={e=>updateMember("methods",m.id,{name:e.target.value})} placeholder="method"/><input value={m.returnType} onChange={e=>updateMember("methods",m.id,{returnType:e.target.value})} placeholder="return type"/></div>
              <div className="checks"><label><input type="checkbox" checked={m.static} onChange={e=>updateMember("methods",m.id,{static:e.target.checked})}/> static</label><label><input type="checkbox" checked={m.abstract} onChange={e=>updateMember("methods",m.id,{abstract:e.target.checked})}/> abstract</label></div>
              <div className="param-head"><span>Parameters</span><button onClick={()=>updateMember("methods",m.id,{params:[...(m.params||[]),{id:uid("p"),name:"param",type:"String"}]})}>+ parameter</button></div>
              {(m.params||[]).map(p=><div className="param" key={p.id}><input value={p.name} onChange={e=>updateMember("methods",m.id,{params:m.params.map(q=>q.id===p.id?{...q,name:e.target.value}:q)})}/><input value={p.type} onChange={e=>updateMember("methods",m.id,{params:m.params.map(q=>q.id===p.id?{...q,type:e.target.value}:q)})}/><button onClick={()=>updateMember("methods",m.id,{params:m.params.filter(q=>q.id!==p.id)})}>×</button></div>)}
            </div>)}
            {!selected.methods.length&&<div className="empty">No methods. Add one to define behavior.</div>}
          </section>
        </div>:<div className="empty-inspector">Select a class on the canvas or model list.</div>}
      </aside>
    </div>

    <section className="bottom-panel">
      <div className="bottom-tabs">
        <button className={tab==="code"?"on":""} onClick={()=>setTab("code")}><Code2 size={15}/> Java Source</button>
        <button className={tab==="preview"?"on":""} onClick={()=>setTab("preview")}><Eye size={15}/> Architecture Summary</button>
        <div className="bottom-spacer"/>
        {tab==="code"&&<><button onClick={copy}>{copied?<Check size={14}/>:<Copy size={14}/>} {copied?"Copied":"Copy"}</button><button onClick={exportAll}><Download size={14}/> Export Java</button></>}
      </div>
      {tab==="code"?<div className="code-area"><div className="file-tabs">{classes.map(c=><button className={selectedId===c.id?"file-on":""} key={c.id} onClick={()=>setSelectedId(c.id)}><FileCode2 size={13}/>{ident(c.name,"NewClass")}.java</button>)}</div><pre>{selected?javaClass(selected):code}</pre></div>:<div className="summary"><div className="stat-card"><Boxes/><b>{stats.classes}</b><span>Classes</span></div><div className="stat-card"><Link2/><b>{stats.relationships}</b><span>Relationships</span></div><div className="stat-card"><Settings2/><b>{stats.attributes}</b><span>Attributes</span></div><div className="stat-card"><Play/><b>{stats.methods}</b><span>Methods</span></div><div className="summary-text"><strong>Architecture overview</strong><p>Your model contains {stats.classes} classes connected by {stats.relationships} relationships. Every class definition is reflected live in the generated Java source.</p></div></div>}
    </section>

    {toast&&<div className="toast"><Check size={14}/>{toast}</div>}

    {showTemplates&&<div className="modal-bg" onMouseDown={e=>e.target===e.currentTarget&&setShowTemplates(false)}><div className="modal">
      <div className="modal-head"><div><h2>Start with a template</h2><p>Choose a realistic UML model, then customize it.</p></div><button onClick={()=>setShowTemplates(false)}><X size={18}/></button></div>
      <div className="template-grid">
        {Object.entries(templates).map(([key,t])=><button className="template" key={key} onClick={()=>loadTemplate(key)}><div className="template-icon"><Boxes size={20}/></div><div><strong>{t.name}</strong><span>{t.classes.length} classes · {t.edges.length} relationships</span></div><ChevronRight size={16}/></button>)}
      </div>
    </div></div>}

    {showHelp&&<div className="modal-bg" onMouseDown={e=>e.target===e.currentTarget&&setShowHelp(false)}><div className="modal help">
      <div className="modal-head"><div><h2>UML Studio quick guide</h2><p>Build the diagram first; the Java source follows automatically.</p></div><button onClick={()=>setShowHelp(false)}><X size={18}/></button></div>
      <div className="guide-grid"><div><b>01 · Classes</b><p>Add a class and edit its name, package, attributes and methods in the Inspector.</p></div><div><b>02 · UML notation</b><p>Use + public, − private, # protected and ~ package visibility. Static members are underlined.</p></div><div><b>03 · Relationships</b><p>Choose a relationship type, optionally enter a label, then drag a handle between classes.</p></div><div><b>04 · Java</b><p>Generated source updates as you edit. Switch Java files from the bottom tabs and export them directly.</p></div></div>
    </div></div>}
  </div>
}
createRoot(document.getElementById("root")).render(<App/>);
