import React,{useEffect,useState} from 'react';
import {api,configured} from './api';
import {contentHash} from './content-links';
import CuratedMedia from './CuratedMedia';
export default function TagDiscovery({tag}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{
  if(!tag)return;
  let alive=true;setData(null);setError('');
  if(!configured){setError('Sign in and publishing data are unavailable in the unconnected preview.');return}
  setBusy(true);
  api('tag-feed',{tag}).then(d=>{if(alive)setData(d)}).catch(e=>{if(alive)setError(e.message)})
   .finally(()=>{if(alive)setBusy(false)});
  return()=>{alive=false};
 },[tag]);
 return <section className="panel">
  <span className="eyebrow">EXPLORE THE UNKNOWN</span>
  <h2>#{tag}</h2>
  <p>Find public stories and community discussions about the same mystery, from OnlyCryptids users.</p>
  {busy&&<p role="status">Looking for related sightings and stories…</p>}
  {error&&<p className="error" role="alert">{error}</p>}
  {data&&<>
   <h3>Related stories ({data.posts.length})</h3>
   {data.posts.map(p=><article className="panel" key={p.id}>
    <h3><a className="content-link" href={contentHash('post',p.id)}>{p.title}</a></h3>
    <p>{p.teaser}</p>
    <small>{p.category} · {p.label}</small>
   </article>)}
   <h3>Community discussions ({data.threads.length})</h3>
   {data.threads.map(t=><article className="panel" key={t.id}>
    <h3><a className="content-link" href={contentHash('thread',t.id)}>{t.title}</a></h3>
    <p>{t.body_excerpt}</p>
    <small>{t.display_name} · {t.category}</small>
   </article>)}
   {!data.posts.length&&!data.threads.length&&<p className="muted">No public stories or discussions with this tag were found in the most recent results.</p>}
   <small>{data.scope}{data.has_more?' Additional older matches may exist.':''}</small>
  </>}
  <CuratedMedia tag={tag}/>
 </section>;
}
