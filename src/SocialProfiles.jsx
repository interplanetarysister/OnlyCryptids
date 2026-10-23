import React,{useState} from 'react';
import {recognizedNetworks,normalizeSocialLink} from '../base44/functions/cryptid-api/social-links.js';

// Purely public URLs, not authorization or social-account credential storage.
export function SocialProfileFields({value={}}){
 return <fieldset className="social-profile-fields"><legend>Link your public social accounts and communities (optional)</legend>
  <p className="muted">Your profile links open your official public pages on Reddit, YouTube, X, Instagram, Facebook, Threads, Bluesky or Tumblr. This does not connect an account or grant posting access.</p>
  <div className="social-profile-grid">{recognizedNetworks.map(p=><label key={p.id}>{p.label}
   <input name={'social_'+p.id} type="text" maxLength={300} defaultValue={value?.[p.id]||''} placeholder={p.hint}/>
  </label>)}</div>
 </fieldset>;
}
export function SocialProfileLinks({links={}}){
 const entries=recognizedNetworks.map(p=>({...p,url:links?.[p.id]})).filter(p=>{try{return p.url&&normalizeSocialLink(p.id,p.url)}catch{return false}});
 if(!entries.length)return null;
 return <div className="social-profile-links" aria-label="Public external profiles">{entries.map(p=>
  <a className="secondary" key={p.id} href={p.url} target="_blank" rel="noopener noreferrer nofollow ugc">{p.label} ↗</a>
 )}</div>;
}
export function InviteCryptidFans(){
 const [message,setMessage]=useState('');
 async function invite(){
  const url=new URL(location.pathname,location.origin).href;
  const text='OnlyCryptids is where strange sightings, cryptid stories and unexplained mysteries meet. Join the community and follow the unknown.';
  if(navigator.share)try{await navigator.share({title:'OnlyCryptids · Follow the unexplained',text,url});setMessage('Invite share menu opened.');return}catch(e){if(e?.name==='AbortError')return}
  try{await navigator.clipboard.writeText(text+'\n'+url);setMessage('Invite copied. Share it with people who want to join.')}catch{setMessage('Share this address: '+url)}
 }
 return <div><button type="button" className="secondary" onClick={invite}>Invite cryptid fans ↗</button>{message&&<p className="muted" role="status">{message}</p>}</div>;
}
