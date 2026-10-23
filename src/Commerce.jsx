import React,{useEffect,useState} from 'react';
import {api,configured} from './api';
import {creditPolicy,creditPacks} from '../base44/functions/cryptid-api/economy.js';
export const dollars=units=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(units*creditPolicy.unitCents/100);

export function SufferingWallet({user,signIn}){
 const [quote,setQuote]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 return <section className="panel"><span className="eyebrow">PLATFORM CREDITS</span><h2>{creditPolicy.name}</h2><p><strong>1 {creditPolicy.name} = $0.25 USD.</strong> New accounts are planned to receive 5 welcome Suffering; each successful AI generation will cost 1 Suffering. Subscription and premium-post credits require verified payments.</p><p className="muted">The 5-credit welcome grant has not been activated. No credits have been issued. Wallet balances, tipping, AI spending, and PayPal checkout remain unavailable until transactions are protected against duplicate or concurrent spending. Suffering is not withdrawable money and cannot improve prize odds.</p><div className="product-grid">{creditPacks.map(p=><button key={p.id} className="secondary" disabled={busy||!configured} onClick={async()=>{if(!user){signIn();return}setBusy(true);setError('');try{setQuote(await api('purchase-quote',{kind:'credits',pack_id:p.id}))}catch(e){setError(e.message)}finally{setBusy(false)}}}>{p.units} {creditPolicy.name} · {dollars(p.units)}</button>)}</div>{quote&&<div className="setup-message"><strong>{quote.units} {creditPolicy.name} · {dollars(quote.units)}</strong><p>Purchase preview only. PayPal funding is not connected; nothing has been charged.</p><button className="primary" disabled>Buy with PayPal — setup pending</button></div>}{error&&<p className="error" role="alert">{error}</p>}</section>
}

export function CreatorPlanManager({creator}){
 const [plans,setPlans]=useState([]),[editing,setEditing]=useState(null),[price,setPrice]=useState(20),[busy,setBusy]=useState(false),[error,setError]=useState('');
 async function load(){const d=await api('creator-plans',{creator_id:creator.id});setPlans(d.plans)}
 useEffect(()=>{if(configured&&creator)load().catch(e=>setError(e.message))},[creator?.id]);
 if(!creator)return null;
 return <section className="panel"><h2>{creator.display_name}: subscription offers</h2>{creator.platform_owned&&<p>Platform-owned profile. Revenue goes to Interplanetary Association to support moderation costs.</p>}<p>Create named offers with a price and description. Every offer unlocks your subscriber-only posts for 30 days; separately priced premium posts cost extra. Pausing an offer prevents new purchases without shortening existing access.</p>{error&&<p className="error" role="alert">{error}</p>}{plans.map(p=><div className="manage plan-row" key={p.id}><div><strong>{p.name}</strong><small>{p.price_suffering} {creditPolicy.name} · {dollars(p.price_suffering)} / 30 days · {p.status}</small><p>{p.description}</p></div><button className="secondary" onClick={()=>{setEditing(p);setPrice(p.price_suffering)}}>Edit</button></div>)}<form key={editing?.id||'new'} onSubmit={async e=>{e.preventDefault();const fields=Object.fromEntries(new FormData(e.currentTarget));setBusy(true);setError('');try{await api('plan-save',{...fields,creator_id:creator.id,id:editing?.id,price_suffering:Number(fields.price_suffering)});setEditing(null);setPrice(20);e.target.reset();await load()}catch(err){setError(err.message)}finally{setBusy(false)}}}><h3>{editing?'Edit offer':'Create an offer'}</h3><label>Offer name<input name="name" required maxLength={60} defaultValue={editing?.name||''} placeholder="Field Notes Membership"/></label><label>What subscribers receive<textarea name="description" maxLength={1000} defaultValue={editing?.description||''} placeholder="Subscriber-only field journals and behind-the-scenes stories."/></label><label>Price in {creditPolicy.name} per 30 days<input name="price_suffering" type="number" required min={1} max={100000} step={1} value={price} onChange={e=>setPrice(e.target.value)}/><small>{Number(price)>0?dollars(Number(price)):'Choose a price'} USD equivalent</small></label><label>Offer status<select name="status" defaultValue={editing?.status||'paused'}><option value="active">Listed on my profile</option><option value="paused">Paused</option></select></label><p className="muted">Billing is inactive. Changes apply to future purchases; existing access keeps its original price and end date. No automatic renewal is enabled.</p><button className="primary" disabled={busy}>Save subscription offer</button>{editing&&<button type="button" className="text-button" onClick={()=>{setEditing(null);setPrice(20)}}>Cancel edit</button>}</form></section>
}

export function CreatorSubscribe({creator,user,signIn,follow}){
 const [plans,setPlans]=useState([]),[quote,setQuote]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{if(configured&&!creator.demo)api('creator-plans',{creator_id:creator.id}).then(d=>setPlans(d.plans)).catch(e=>setError(e.message))},[creator.id]);
 return <>{creator.platform_owned&&<p>Subscriptions support Only Cryptids platform moderation. Beneficiary: Interplanetary Association.</p>}<p>Subscribe to {creator.display_name} for subscriber-only stories and posts. Individually priced premium content is separate.</p>{creator.demo?<p className="setup-message">This is a fictional demonstration profile.</p>:plans.length?plans.map(p=><div className="panel" key={p.id}><h3>{p.name}</h3><p>{p.description}</p><strong>{p.price_suffering} {creditPolicy.name} · {dollars(p.price_suffering)} / 30 days</strong><button className="secondary" disabled={busy} onClick={async()=>{if(!user){signIn();return}setBusy(true);setError('');try{setQuote(await api('purchase-quote',{kind:'subscription',plan_id:p.id}))}catch(e){setError(e.message)}finally{setBusy(false)}}}>Review subscription</button></div>):<p className="muted">This creator has not listed subscription offers yet.</p>}{quote&&<div className="setup-message"><h3>Review your subscription</h3><p>{quote.units} {creditPolicy.name} ({dollars(quote.units)}) for {quote.period_days} days. Renew manually; no automatic credit spending.</p><p>Recipient: {quote.beneficiary_name}. {quote.revenue_purpose==='moderation_costs'?'Revenue supports platform moderation.':''}</p><p>Payments and credit spending are not active. No purchase has occurred.</p><button className="primary" disabled>Subscribe with {creditPolicy.name} — setup pending</button></div>}{error&&<p className="error" role="alert">{error}</p>}<button className="text-button" onClick={follow}>Follow free instead</button></>
}

export function PremiumUnlock({post,user,signIn}){
 const [quote,setQuote]=useState(null),[error,setError]=useState('');
 return <><p>{post.teaser}</p><p><strong>{post.price_suffering} {creditPolicy.name} · {dollars(post.price_suffering||0)}</strong> for this individual post. Creator subscriptions do not include separately priced posts.</p><button className="secondary" onClick={async()=>{if(!user){signIn();return}try{setQuote(await api('purchase-quote',{kind:'premium',post_id:post.id}))}catch(e){setError(e.message)}}}>Review unlock</button>{quote&&<div className="setup-message"><p>Confirmed price: {quote.units} {creditPolicy.name} ({dollars(quote.units)}). No credits have been deducted. Purchases are awaiting payment setup.</p><button className="primary" disabled>Unlock with {creditPolicy.name} — setup pending</button></div>}{error&&<p className="error" role="alert">{error}</p>}</>
}

export function CreatorEarnings({user,signIn}){
 const [summary,setSummary]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{if(!configured||!user){setSummary(null);return}let active=true;setBusy(true);api('earnings-summary').then(d=>{if(active)setSummary(d)}).catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setBusy(false)});return()=>{active=false}},[user?.id]);
 const usd=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n||0)/100);
 return <section className="panel"><span className="eyebrow">CREATOR EARNINGS / PAYPAL</span><h2>Subscription earnings & withdrawals</h2>
  <p>Only confirmed creator subscription payments may become cash earnings. Suffering credits, tips, AI memberships and unverified purchases are excluded.</p>
  {!user?<button className="primary" onClick={signIn}>Sign in to see your earnings</button>:busy?<p>Checking your account’s verified records…</p>:summary?<>
    <div className="stats"><div><small>{summary.withdrawals_enabled?'Available to withdraw':'Reconciled earnings (locked)'}</small><strong>{usd(summary.available_cents)}</strong></div><div><small>Pending / held</small><strong>{usd(summary.pending_cents+summary.committed_cents)}</strong></div><div><small>Previously paid</small><strong>{usd(summary.paid_cents)}</strong></div></div>
    <p className="muted">PayPal integration: {summary.provider_connected?'Merchant identifier configured':'Not connected'} · Creator receiving account: {summary.recipient_connected?'Verified record exists':'Not linked'}</p>
    <p className="setup-message">{summary.reason}</p>
    {summary.untrusted_records>0&&<p className="error">Some records could not be verified and were excluded. Contact support for a reconciliation review.</p>}
    <button className="primary" disabled={!summary.withdrawals_enabled}>Withdraw to PayPal — {summary.withdrawals_enabled?'Available':'awaiting approval'}</button>
    <h3>Withdrawal history</h3>{summary.history?.length?summary.history.map((item,i)=><p key={i}>{usd(item.amount_cents)} · {item.status} · {item.requested_at?.slice(0,10)||'Date pending'}</p>):<p className="muted">No verified withdrawal history.</p>}
  </>:<p>Unable to retrieve an earnings summary.</p>}
  {error&&<p className="error" role="alert">{error}</p>}
 </section>;
}

export function SufferingTipQuote({target_kind='post',target_id,user,signIn}){
 const [units,setUnits]=useState(1),[quote,setQuote]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 return <details className="panel"><summary>Tip with Suffering (preview)</summary><p className="muted">See the intended tip amount without transferring any credits. Tips are not yet active or cash redeemable.</p>
 <label>Amount<select value={units} onChange={e=>{setUnits(Number(e.target.value));setQuote(null)}}>{[1,2,3,5,10,20].map(n=><option key={n} value={n}>{n} Suffering · {dollars(n)}</option>)}</select></label>
 <button className="secondary" disabled={busy} onClick={async()=>{if(!user){signIn?.();return}setBusy(true);setError('');try{const v=await api('tip-quote',{target_kind,target_id,units});setQuote(v)}catch(e){setError(e.message)}finally{setBusy(false)}}}>Review tip</button>
 {quote&&<p className="setup-message">{quote.units} Suffering for {quote.recipient}. No credits sent or deducted. {quote.message}</p>}
 {error&&<p className="error" role="alert">{error}</p>}
 </details>;
}
