import React, {useEffect,useState} from 'react';

// Standalone source-backed public media feed. No account credentials or Base44
// service-role permissions are exposed to the browser.
const ENDPOINT='https://onlycryptids-media-scout.interplanetary-fund.workers.dev';
export default function CuratedMedia({tag='',compact=false}) {
  const [posts,setPosts]=useState([]);
  const [state,setState]=useState('loading');
  useEffect(()=>{
    const ctl=new AbortController();
    setState('loading');
    const query=new URLSearchParams({limit:compact?'6':'24'});
    if(tag) query.set('tag',tag);
    fetch(ENDPOINT+'/api/posts?'+query,{signal:ctl.signal})
      .then(r=>{if(!r.ok)throw new Error('Media feed unavailable');return r.json()})
      .then(v=>{setPosts(v.posts||[]);setState('ready')})
      .catch(e=>{if(e.name!=='AbortError')setState('error')});
    return ()=>ctl.abort();
  },[tag,compact]);
  if(state==='loading') return <section className="panel"><p>Searching licensed cryptid media…</p></section>;
  if(state==='error') return <section className="panel"><p>Source-backed media is temporarily unavailable.</p></section>;
  return <section aria-label="Source-backed cryptid pictures and videos" className="source-media-feed">
    <div className="section-title"><h2>Cryptid pictures & videos</h2><small>Curated from licensed public media · Claims are not verified sightings</small></div>
    {!posts.length&&<p>No source-licensed items have been catalogued in this collection yet.</p>}
    <div className="source-media-grid">{posts.map(p=><article className="panel source-media-card" id={'media-'+p.id} key={p.id}>
      <h3>{p.title}</h3>
      {p.kind==='video'
        ? <video controls preload="none" src={p.media_url} aria-label={p.alt_text||p.title}>Your browser cannot play this clip.</video>
        : <img loading="lazy" referrerPolicy="no-referrer" src={p.media_url} alt={p.alt_text||p.title}/>}
      <p>{p.caption}</p>
      <p className="source-media-credit"><strong>Creator/source credit:</strong> {p.author_credit} · <a href={p.source_url} target="_blank" rel="noreferrer noopener">Original Wikimedia Commons file</a> · <a href={p.license_url||p.source_url} target="_blank" rel="noreferrer noopener">{p.license_name}</a></p>
      <div className="source-media-tags">{(p.hashtags||[]).map(t=><a key={t} href={'#tag='+encodeURIComponent(t)}>#{t}</a>)}</div>
      <small>Related OnlyCryptids stories: select a hashtag to find related content.</small>
    </article>)}</div>
  </section>;
}
