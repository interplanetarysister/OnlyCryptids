import React,{useEffect,useState} from 'react';
import {api,configured} from './api';
import {scoreCategories,scoreLabels,monthKey} from '../base44/functions/cryptid-api/leaderboard.js';

const lanes=[['human-stories','Human-created stories'],['human-images','Human-created images'],['ai-stories','AI-assisted stories'],['ai-images','AI-assisted images']];
const prior=m=>{const [y,n]=m.split('-').map(Number);return new Date(Date.UTC(y,n-2,1)).toISOString().slice(0,7)};
const after=m=>{const [y,n]=m.split('-').map(Number);return new Date(Date.UTC(y,n,1)).toISOString().slice(0,7)};
function Rate({entry,user,signIn,onRated}){
 const [scores,setScores]=useState({engagement:3,community_support:3,creativity:3,fear:3,cryptid:3});
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <div className="leaderboard-rating">
  <button className="secondary" onClick={()=>{if(!user){signIn?.();return}setOpen(v=>!v)}}>Rate this post</button>
  {open&&<form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await api('leaderboard-rate',{post_id:entry.post_id,...scores});setOpen(false);onRated?.()}catch(err){setError(err.message)}finally{setBusy(false)}}}>
   <p className="muted">Rate every category from 1–5. Cryptid relevance carries the most weight. Authors cannot rate their own work.</p>
   {scoreCategories.map(key=><label key={key}>{scoreLabels[key]}<select value={scores[key]} onChange={e=>setScores(s=>({...s,[key]:Number(e.target.value)}))}>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} / 5</option>)}</select></label>)}
   {error&&<p className="error" role="alert">{error}</p>}
   <button className="primary" disabled={busy}>Submit five-category rating</button>
  </form>}
 </div>;
}
export default function SufferingLeaderboard({user,signIn}){
 const [month,setMonth]=useState(monthKey()),[data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[reload,setReload]=useState(0);
 useEffect(()=>{if(!configured)return;let active=true;setBusy(true);setError('');
  api('leaderboard-month',{month}).then(v=>{if(active)setData(v)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setBusy(false)});
  return()=>{active=false}},[month,reload]);
 return <section className="panel">
  <span className="eyebrow">ONLYCRYPTIDS / COMMUNITY RECOGNITION</span><h2>Top 10 of the Unknown</h2>
  <p>Four monthly community rankings for human-created and AI-assisted images and stories. Rankings are provisional and separate from final prize judging.</p>
  <div className="form-row"><button className="secondary" onClick={()=>setMonth(prior(month))}>Previous month</button><strong>{month}</strong><button className="secondary" disabled={month>=monthKey()} onClick={()=>setMonth(after(month))}>Next month</button></div>
  <p className="setup-message">No prize award is active. Purchased Suffering and tips do not buy contest entries or winning odds. Official rules and independent anti-abuse review are required.</p>
  {busy?<p>Checking community ratings…</p>:error?<p className="error" role="alert">{error}</p>:<>
   {data?.data_limited&&<p className="error">Some older records may be omitted. This is not a complete historical ranking.</p>}
   {lanes.map(([key,title])=><section className="panel" key={key}><h3>{title}</h3>
    {data?.lanes?.[key]?.length?data.lanes[key].map(entry=><article className="manage" key={entry.post_id}>
      <div><strong>#{entry.rank} · {entry.title}</strong><small>@{entry.handle} · {entry.rater_count} independent ratings</small>
       <div className="leaderboard-metrics">{scoreCategories.map(k=><p key={k}><strong>{scoreLabels[k]}:</strong> {entry.ratings[k]==null?'Awaiting independent ratings':String(entry.ratings[k])+' / 5'}</p>)}</div>
       <p className="muted">{entry.has_enough_ratings?'Provisional score: '+entry.provisional_score:'At least three independent ratings required for a quality score'}</p>
       <Rate entry={entry} user={user} signIn={signIn} onRated={()=>setReload(r=>r+1)}/>
      </div></article>):<p className="muted">No eligible published posts here yet.</p>}
   </section>)}
   <section className="panel"><h3>Most Suffering tipped</h3><p className="muted">Tipping is inactive. This board never determines a contest prize.</p>
    {data?.top_tipped?.length?data.top_tipped.map(x=><p key={x.post_id}>#{x.rank} · {x.title} · {x.tip_units} Suffering</p>):<p>No settled tips yet.</p>}
   </section>
  </>}
 </section>;
}