import React,{useState,useEffect,useMemo} from 'react';
import {api,configured} from './api';
import {proofreadText,buildWitnessAccount,fictionalCoda} from '../base44/functions/cryptid-api/proofread.js';

const topics=['Satellites or unidentified objects','Supercomputers or artificial intelligence','Future technologies','Signals and related experiences'];
const fields=[
 ['headline','Headline','Give your account a factual, specific headline.',140,true,'text'],
 ['topic','What was involved?','Describe the observation, even if you do not know what the object was.',0,true,'select'],
 ['event_date','Date or approximate date','An approximate month and year is fine.',100,true,'text'],
 ['time_of_day','Time of day','Include local time or whether it was dawn, daytime, dusk or night.',100,true,'text'],
 ['location_region','General area','City/region/country only. Never provide your street address.',160,true,'text'],
 ['weather','Visibility and surroundings','Cloud cover, light, sound, weather, surroundings.',500,false,'textarea'],
 ['activity','What were you doing?','Where were you standing or traveling, and what drew your attention?',1500,true,'textarea'],
 ['appearance','Describe exactly what you saw','Shape, apparent size, color, lights, texture, markings, sound, and any changes.',2500,true,'textarea'],
 ['object_behavior','What was it doing?','Direction, motion, hovering, speed, blinking, position, duration, interactions or observed effects.',2500,true,'textarea'],
 ['altitude','How high did it appear to be?','Estimate only; include what you used for scale. It is okay to say unknown.',250,true,'textarea'],
 ['other_witnesses','Who else witnessed it?','State whether anyone else saw or heard it, and what they independently said.',1500,true,'textarea'],
 ['later_sightings','Did you see it again?','Whether it returned, changed position, or was later identified.',1500,true,'textarea'],
 ['impact','What happened next?','Include actual consequences, feelings, reactions and how the encounter ended.',1500,true,'textarea'],
 ['source_notes','Evidence and alternative explanations','Optional media references, public sources, aircraft/satellite checks or details you are unsure about.',2000,false,'textarea'],
 ['original_account','Tell the full story in your own words','At least 200 characters. Describe what you experienced chronologically and in vivid sensory detail. Do not add events that did not happen.',12000,true,'textarea']
];
const initial={topic:topics[0],credit_mode:'name',fictional_coda:false,accurate:false,agreed:false,publish_consent:false};
const invitation="REAL ENCOUNTERS WANTED: Satellites, unidentified objects, supercomputers and future technologies. What did you actually witness? Describe the appearance, height estimate, movements, time, place, other witnesses and aftermath. Only Cryptids will correct basic spelling and grammar, preserve the reported facts and credit you by name/pseudonym or anonymously. Share an honest account: ";
function urlFor(id){return location.origin+location.pathname+(id?'#sky-report='+encodeURIComponent(id):'#Sky%20signals')}
async function copy(value){try{await navigator.clipboard.writeText(value);return true}catch{return false}}
function SocialOutreach({url}) {
 const text=invitation+url;
 const networks=[
  ['Reddit','https://www.reddit.com/submit?url='+encodeURIComponent(url)+'&title='+encodeURIComponent('Real satellite and future-tech encounters wanted')],
  ['X / Twitter','https://twitter.com/intent/tweet?text='+encodeURIComponent(text.slice(0,260))],
  ['Facebook','https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(url)],
  ['Threads','https://www.threads.net/intent/post?text='+encodeURIComponent(text)],
  ['Bluesky','https://bsky.app/intent/compose?text='+encodeURIComponent(text)],
  ['LinkedIn','https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(url)],
  ['TikTok',null],['Instagram',null],['YouTube',null],['Pinterest',null]
 ];
 const [copied,setCopied]=useState('');
 return <section className="panel sky-outreach"><h3>Help find more witnesses</h3><p>Copy the invitation or open a network's share composer. These controls do not publish to any external account without its authorization.</p><p className="sky-quote">{invitation}<strong>{url}</strong></p><button className="secondary" type="button" onClick={async()=>setCopied(await copy(text)?'Invitation copied':'Copy is unavailable on this device')}>Copy complete invitation</button>
 <div className="sky-network-grid">{networks.map(([name,href])=><button type="button" className="secondary" key={name} onClick={async()=>{if(href)window.open(href,'_blank','noopener,noreferrer');else setCopied(await copy(text)?name+' caption copied':name+': copy unavailable')}}>{name}{href?' · compose':' · copy'}</button>)}</div><small role="status">{copied}</small></section>
}
function Report({id,back}){
 const [item,setItem]=useState(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 useEffect(()=>{let mounted=true;setLoading(true);setItem(null);api('sky-read',{id}).then(r=>{if(mounted)setItem(r)}).catch(e=>{if(mounted)setError(e.message)}).finally(()=>{if(mounted)setLoading(false)});return()=>{mounted=false}},[id]);
 if(loading)return <div className="panel">Opening eyewitness report…</div>;
 if(!item)return <section className="panel"><p role="alert">{error||'The report is unavailable.'}</p><button className="secondary" onClick={back}>Return to the call for witnesses</button></section>;
 const {report,fictional_ending}=item;
 return <article className="sky-report panel"><button className="text-button" onClick={back}>← All sky reports</button><span className="eyebrow">UNVERIFIED FIRSTHAND REPORT · {report.topic}</span><h2>{report.headline}</h2><p>Submitted by <strong>{report.contributor}</strong> · {new Date(report.created_date).toLocaleDateString()}</p><p className="muted">This is a contributor's account, not independent confirmation of a satellite, technology or explanation. Spelling and basic grammar were cleaned automatically, without inventing events.</p><div className="sky-report-story">{report.edited_account}</div>{fictional_ending&&<div className="sky-fictional-coda"><strong>Fictional atmosphere — not testimony</strong><p>{fictional_ending.replace(/^.*\n/,'')}</p></div>}<button className="primary" onClick={()=>copy(urlFor(report.id))}>Copy this credited story link</button><SocialOutreach url={urlFor(report.id)}/></article>
}
export default function SkyWitness({user}){
 const [draft,setDraft]=useState(initial),[preview,setPreview]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[receipt,setReceipt]=useState(null),[reports,setReports]=useState([]),[next,setNext]=useState(null),[detail,setDetail]=useState('');
 const account=useMemo(()=>buildWitnessAccount(draft),[draft]);
 const corrected=useMemo(()=>proofreadText(account),[account]);
 const update=(field,value)=>{setDraft(x=>({...x,[field]:value}));setPreview(false);setError('')};
 async function load(offset=0){try{const out=await api('sky-list',{offset});setReports(list=>offset?[...list,...out.reports]:out.reports);setNext(out.next_offset)}catch(e){setError(e.message)}}
 useEffect(()=>{if(configured)load();const check=()=>{const match=/^#sky-report=([A-Za-z0-9_.-]{1,100})$/.exec(location.hash);setDetail(match?match[1]:'')};check();addEventListener('hashchange',check);return()=>removeEventListener('hashchange',check)},[]);
 async function submit(e){e.preventDefault();setError('');if(!preview){setPreview(true);return}setBusy(true);try{const out=await api('sky-submit',{...draft,website:'',publish_consent:draft.publish_consent===true,accurate:draft.accurate===true,agreed:draft.agreed===true});setReceipt(out);if(out.status==='published')await load()}catch(e){setError(e.message)}finally{setBusy(false)}}
 const open=id=>{location.hash='sky-report='+encodeURIComponent(id);setDetail(id);window.scrollTo({top:0})};
 const back=()=>{location.hash='Sky%20signals';setDetail('')};
 if(detail)return <Report id={detail} back={back}/>;
 return <div className="sky-shell"><header className="sky-hero"><span className="eyebrow">ONLY CRYPTIDS · THE SKY WITNESS PROJECT</span><h2>What has been watching from above?</h2><p>We are collecting <strong>real accounts</strong> of satellites, unusual objects, signals, supercomputers and technologies that witnesses could not immediately explain.</p><p>Have you noticed points of light or objects over multiple neighborhoods? What did they look like? What did they do? What did they witness, record, or appear to be part of? Tell us only what you personally observed or can source. Being curious is not proof of surveillance.</p><a href="#sky-submit" className="sky-call">Tell us what you saw ↓</a></header>
 <section className="panel sky-guidance"><h3>Give us the details that make an account worth preserving</h3><p>Describe the object at that exact moment, what you were doing, what changed, whether others independently witnessed it, the estimated height and your basis for judging it, the time, and whether it returned later. Include eerie, frightening, disturbing or heartbreaking details <strong>only if they actually happened</strong>.</p><p>We preserve the facts you report. If you opt into a creative horror ending, it appears separately and explicitly marked as fiction.</p></section>
 <section id="sky-submit" className="panel sky-form"><h3>Submit your eyewitness account</h3><p>Every submitted report receives basic spelling and grammar cleanup immediately. Approved-to-publish reports receive a public link and contributor credit. Reports containing likely private contact information are held for moderation.</p>
 {receipt?<div role="status" className="sky-receipt"><h3>{receipt.status==='published'?'Your report is published':'Your report is held for privacy review'}</h3><p>Credit: {receipt.credit}. {receipt.status==='published'?'Share the credited report link below.':'A moderator must review private details before it can go public.'}</p>{receipt.link&&<><button className="primary" onClick={()=>open(receipt.id)}>Read your published report</button><button className="secondary" onClick={()=>copy(urlFor(receipt.id))}>Copy story link</button></>}<button className="text-button" onClick={()=>{setReceipt(null);setDraft(initial);setPreview(false)}}>Submit another account</button></div>:
 <form onSubmit={submit}><div className="sky-byline"><label>How would you like to be credited?<select value={draft.credit_mode} onChange={e=>update('credit_mode',e.target.value)}><option value="name">Display name or pseudonym</option><option value="anonymous">Anonymous witness</option></select></label>{draft.credit_mode==='name'&&<label>Credit name<input maxLength={80} value={draft.contributor||''} onChange={e=>update('contributor',e.target.value)} required placeholder="Name or chosen pseudonym"/></label>}</div>
 {fields.map(([name,title,help,max,required,type])=><label key={name}>{title}{required&&<span aria-label="Required"> *</span>}{type==='select'?<select value={draft[name]||topics[0]} onChange={e=>update(name,e.target.value)}>{topics.map(t=><option key={t}>{t}</option>)}</select>:type==='textarea'?<textarea name={name} rows={name==='original_account'?9:3} value={draft[name]||''} maxLength={max} required={required} minLength={name==='original_account'?200:undefined} onChange={e=>update(name,e.target.value)}/>:<input name={name} type="text" value={draft[name]||''} maxLength={max} required={required} onChange={e=>update(name,e.target.value)}/>}<small>{help}</small></label>)}
 <label className="check"><input type="checkbox" checked={draft.fictional_coda===true} onChange={e=>update('fictional_coda',e.target.checked)}/>Add a clearly labeled, invented unsettling epilogue after my factual account.</label>
 <label className="check"><input type="checkbox" required checked={draft.accurate===true} onChange={e=>update('accurate',e.target.checked)}/>This account describes what I witnessed or what I can substantiate to the best of my knowledge; I have not invented events.</label>
 <label className="check"><input type="checkbox" required checked={draft.publish_consent===true} onChange={e=>update('publish_consent',e.target.checked)}/>I give Only Cryptids a nonexclusive, royalty-free permission to proofread, publish and share this specific submission with my selected credit. I keep ownership of my original words and may request removal.</label>
 <label className="check"><input type="checkbox" required checked={draft.agreed===true} onChange={e=>update('agreed',e.target.checked)}/>I will not share someone else's private details, exact address, or material I lack permission to submit.</label>
 {preview&&<div className="sky-preview"><h3>Proofread preview</h3><p>Check that the cleaned account still says exactly what happened. To change anything, edit the fields above; the preview will update before publication.</p><p className="muted">{corrected.changes.length?corrected.changes.join(' · '):'No routine spelling or punctuation corrections detected.'} Automated proofreading is limited and may miss errors.</p><div className="sky-report-story">{corrected.text}</div>{draft.fictional_coda===true&&<div className="sky-fictional-coda"><strong>Fictional epilogue, not eyewitness evidence</strong><p>{fictionalCoda.replace(/^.*\n/,'')}</p></div>}</div>}
 {error&&<p className="error" role="alert">{error}</p>}
 <button className="primary" type="submit" disabled={busy||!configured}>{busy?'Submitting…':preview?'Publish corrected eyewitness account':'Proofread and preview account'}</button>{!configured&&<p className="muted">The reporting service is not connected in this preview.</p>}
 </form>}</section>
 <section className="sky-archive"><h3>Recent eyewitness reports</h3><p className="muted">Contributor accounts are unverified. Nothing here establishes the identity or purpose of an observed object.</p>{reports.length?reports.map(r=><button className="panel sky-archive-item" key={r.id} onClick={()=>open(r.id)}><span className="eyebrow">{r.topic}</span><strong>{r.headline}</strong><small>By {r.contributor} · {r.location_region}</small></button>):<div className="panel">No eyewitness reports have been published in this category yet. Be the first to contribute.</div>}{next!==null&&<button className="secondary" onClick={()=>load(next)}>More reports</button>}</section><SocialOutreach url={urlFor()}/></div>
}
