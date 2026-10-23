import React,{useEffect,useState} from 'react';
import {Sparkles,Image as ImageIcon,BookOpen,PenLine,Copy,ShieldCheck} from 'lucide-react';
import {api,configured} from './api';
import {aiPlans,aiModes,aiTones,aiArtStyles,aiAudienceInterests,makeOnlyCryptidsBrief} from '../base44/functions/cryptid-api/onlycryptids-ai.js';

const money=cents=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
const pretty=s=>s.replaceAll('-', ' ').replace(/\b\w/g,ch=>ch.toUpperCase());

export default function AIStudio({user,signIn}){
 const [mode,setMode]=useState('story');
 const [idea,setIdea]=useState('');
 const [creature,setCreature]=useState('');
 const [setting,setSetting]=useState('');
 const [tone,setTone]=useState('unsettling');
 const [artStyle,setArtStyle]=useState('cinematic-ink');
 const [imageContext,setImageContext]=useState('');
 const [file,setFile]=useState(null);
 const [previewUrl,setPreviewUrl]=useState('');
 const [protectedTerms,setProtectedTerms]=useState('');
 const [learn,setLearn]=useState(false);
 const [interests,setInterests]=useState([]);
 const [catalog,setCatalog]=useState(null);
 const [brief,setBrief]=useState(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 useEffect(()=>{if(!configured)return;let active=true;
   api('ai-catalog').then(d=>{if(active)setCatalog(d)}).catch(e=>{if(active)setError(e.message)});
   if(user)api('ai-preferences').then(d=>{if(active){setLearn(d.learn_from_my_posts);setInterests(d.interests);setProtectedTerms((d.protected_terms||[]).join(', '))}}).catch(()=>{});
   return()=>{active=false};
 },[user?.id]);
 useEffect(()=>()=>{if(previewUrl)URL.revokeObjectURL(previewUrl)},[previewUrl]);
 function chooseImage(e){
  const selected=e.target.files?.[0]||null;
  setError('');setFile(null);setPreviewUrl('');
  if(!selected)return;
  if(!['image/jpeg','image/png','image/webp'].includes(selected.type)||selected.size>10*1024*1024){
   setError('Choose a JPG, PNG or WebP image under 10 MB.');e.target.value='';return;
  }
  setFile({name:selected.name,size:selected.size,type:selected.type});
  setPreviewUrl(URL.createObjectURL(selected));
  setBrief(null);
 }
 async function prepare(e){
  e.preventDefault();setBusy(true);setError('');setMessage('');
  try{
   if(mode==='photo-story'&&!file)throw new Error('Upload an image to prepare an image-inspired story.');
   const request={mode,idea,creature,setting,tone,artStyle,imageContext,protectedTerms};
   // The selected file stays on this device. This preview cannot inspect pixels.
   const out=configured?await api('ai-brief',request):{brief:makeOnlyCryptidsBrief(request)};
   setBrief(out.brief);
  }catch(e){setError(e.message||'The creative brief could not be prepared.')}
  finally{setBusy(false)}
 }
 async function savePreferences(){
  if(!user){signIn?.();return}
  setBusy(true);setError('');setMessage('');
  try{await api('ai-preferences-save',{learn_from_my_posts:learn,interests,protected_terms:protectedTerms});setMessage('Your editorial preferences were saved. No content was sent to model training.')}
  catch(e){setError(e.message)}finally{setBusy(false)}
 }
 async function generate(){
  if(!user){signIn?.();return}
  setBusy(true);setError('');try{await api('ai-generate',{mode});setMessage('Generation request accepted.')}
  catch(e){setError(e.message)}finally{setBusy(false)}
 }
 const modeIcons={story:BookOpen,'photo-story':ImageIcon,refine:PenLine,art:Sparkles};
 return <>
  <section className="page-intro">
   <span className="eyebrow">ONLYCRYPTIDS / THE STORYKEEPER</span>
   <h2>Give the unknown a voice.</h2>
   <p>Original creepy stories, uncanny image-inspired tales, expert editing and cinema-grade comic-realism artwork. Every creation stays a private draft until you choose to publish it.</p>
  </section>
  <section className="panel" aria-label="OnlyCryptids AI subscriptions">
   <span className="eyebrow">MEMBERSHIP OPTIONS · PROPOSED PRICING</span>
   <h3>Choose your level of the unexplained</h3>
   <div className="product-grid">
    {aiPlans.map(p=><article className="panel" key={p.id}>
     <h3>{p.name}</h3><strong>{p.monthlyCents?money(p.monthlyCents)+'/month':'Free'}</strong>
     <p>{p.description}</p>
     <small>{p.features.length?p.features.map(f=>aiModes[f]?.name||f).join(' · '):'Standard posting and reading'}</small>
     {p.monthlyCents>0&&<p className="muted">PayPal subscription setup pending. Checkout unavailable.</p>}
    </article>)}
   </div>
   <p className="muted">These prices are drafts, not purchasable plans. The intended business recipient is cuddlemeplatonically@gmail.com. Creator subscriptions are separate and do not unlock AI.</p>
   {catalog?.subscription&&<p><ShieldCheck size={16}/> Verified AI membership: {pretty(catalog.subscription.plan_id)}. Current period ends {new Date(catalog.subscription.expires_at).toLocaleDateString()}.</p>}
   {!catalog?.generation_enabled&&<p className="setup-message">Paid AI generation and checkout are not active. You can prepare and copy a creative brief below for free, without using AI credits.</p>}
  </section>
  <section className="panel">
   <h3>OnlyCryptids creation studio</h3>
   <div className="form-row">
    {Object.entries(aiModes).map(([id,option])=>{const Icon=modeIcons[id];return <button type="button" className={mode===id?'primary':'secondary'} key={id} aria-pressed={mode===id} onClick={()=>{setMode(id);setBrief(null)}}><Icon size={16}/>{option.name}</button>})}
   </div>
   <form onSubmit={prepare}>
    {mode==='photo-story'&&<div>
     <label>Upload the image that inspires your story<input type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage}/></label>
     {previewUrl&&<img src={previewUrl} alt="Local preview of your chosen reference" style={{maxWidth:320,width:'100%',borderRadius:12}}/>}
     {file&&<p className="muted">{file.name} · Local preview only. The image has not been uploaded or analyzed by AI.</p>}
     <label>Describe what's in the picture, including anything the story should emphasize<textarea value={imageContext} onChange={e=>setImageContext(e.target.value)} maxLength={2000} placeholder="A shadow between two pines, a pair of eyes above the treeline and one footprint…"/></label>
    </div>}
    <label>{mode==='refine'?'Your original story':mode==='art'?'What should the artwork show?':'Your idea or encounter'}
     <textarea rows={mode==='refine'?8:5} value={idea} maxLength={30000} onChange={e=>setIdea(e.target.value)} placeholder={mode==='refine'?'Paste your work. Unusual names and your voice will be preserved.':'Someone heard a voice mimicking theirs from a ravine after midnight…'}/>
    </label>
    <div className="form-row">
     <label>Cryptid / mysterious name<input value={creature} onChange={e=>setCreature(e.target.value)} maxLength={120} placeholder="Mothman, an original creature, or unknown"/></label>
     <label>Place or setting<input value={setting} onChange={e=>setSetting(e.target.value)} maxLength={200} placeholder="A deserted highway at 2:13 AM"/></label>
    </div>
    <div className="form-row">
     <label>Vibe<select value={tone} onChange={e=>setTone(e.target.value)}>{aiTones.map(v=><option key={v} value={v}>{pretty(v)}</option>)}</select></label>
     <label>OnlyCryptids visual signature<select value={artStyle} onChange={e=>setArtStyle(e.target.value)}>{Object.keys(aiArtStyles).map(v=><option key={v} value={v}>{pretty(v)}</option>)}</select></label>
    </div>
    <label>Names, cryptid species and unusual terms to protect<input value={protectedTerms} onChange={e=>setProtectedTerms(e.target.value)} maxLength={1000} placeholder="Wendigo Hollow, Naru-Ash, Yowie"/></label>
    <p className="muted">The Storykeeper is instructed to fix ordinary spelling and grammar without changing unfamiliar names, newly invented cryptids or intentional dialect. Stories use strong hooks, rising dread and a lingering mystery. Art direction favors sharp, realistic comic rendering and cinematic lighting.</p>
    {error&&<p className="error" role="alert">{error}</p>}
    {message&&<p className="setup-message" role="status">{message}</p>}
    <button className="primary" type="submit" disabled={busy}><Sparkles size={17}/>{busy?'Preparing…':'Prepare free creative brief'}</button>
   </form>
   {brief&&<section className="panel">
    <h3>OnlyCryptids editorial brief</h3>
    <p>Style: {brief.style} · {brief.tone} · Draft only · AI-Generated label required for eventual model output</p>
    <p className="muted">This is a writing and art direction brief, not a generated story or image. In image mode, no uploaded image pixels have been analyzed.</p>
    <details><summary>View complete writing and art instructions</summary><pre className="brief-text">{brief.system+'\n\n'+brief.user}</pre></details>
    <div className="form-row">
     <button className="secondary" onClick={()=>{(navigator.clipboard?.writeText?.(brief.system+'\n\n'+brief.user)||Promise.reject(new Error('Clipboard unavailable'))).then(()=>setMessage('Creative brief copied.')).catch(()=>setError('Copy was not permitted by your browser.'))}}><Copy size={16}/>Copy brief</button>
     <button className="primary" disabled={!catalog?.generation_enabled||busy||!user} onClick={generate}>Generate with subscription — {catalog?.generation_enabled?'Ready':'Not active'}</button>
    </div>
   </section>}
  </section>
  <section className="panel">
   <h3>Teach your Storykeeper what you enjoy</h3>
   <p>Choose favorite themes. You can also opt in to using short excerpts from your own published, non-AI posts as private writing context for future briefs. This does not train a shared model, scan private messages or copy other members' posts.</p>
   <label className="check"><input type="checkbox" checked={learn} onChange={e=>setLearn(e.target.checked)}/>Personalize from my own public writing (optional)</label>
   <div className="form-row">{aiAudienceInterests.map(key=><label className="check" key={key}><input type="checkbox" checked={interests.includes(key)} onChange={e=>setInterests(cur=>e.target.checked?[...cur,key]:cur.filter(x=>x!==key))}/>{pretty(key)}</label>)}</div>
   <button className="secondary" disabled={busy||!configured} onClick={savePreferences}>{user?'Save preferences':'Sign in to save preferences'}</button>
   <p className="muted">Opt-out is always available. Editorial preferences apply only to OnlyCryptids, not to Interplanetary Fund.</p>
  </section>
 </>;
}
