import React,{useEffect,useState} from 'react';
import {api} from './api';
export {default as Forums} from './Forums';

export function BlockedAccounts({user,onChange}){
 const [blocks,setBlocks]=useState([]),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function load(){const d=await api('block-list');setBlocks(d.blocks)}
 useEffect(()=>{if(user)load().catch(e=>setError(e.message))},[user?.id]);
 if(!user)return null;
 return <section className="panel"><h2>Blocked creators</h2><p>Blocking hides your content from each other while signed in and prevents new follows, comments and forum interactions. Public content remains accessible outside your accounts. Blocking does not cancel subscriptions.</p>{error&&<p className="error" role="alert">{error}</p>}{!blocks.length&&<p className="muted">No blocked creators.</p>}{blocks.map(b=><div className="manage" key={b.id}><strong>{b.display_name}</strong><button className="secondary" disabled={busy} onClick={async()=>{setBusy(true);setError('');try{await api('unblock',{id:b.id});await load();await onChange()}catch(e){setError(e.message)}finally{setBusy(false)}}}>Unblock</button></div>)}</section>
}
