// Dedicated OnlyCryptids AI action boundary.
// No client path creates paid access; merchant status comes from verified server records.
import {aiPlans,aiMerchant,aiAudienceInterests,normalizeProtectedTerms,makeOnlyCryptidsBrief,featuresForPlan} from './onlycryptids-ai.js';

export async function handleAIAction({action,data,user,db,headers,audit,RequestError}){
 const ok=value=>Response.json(value,{headers});
 const auth=()=>{if(!user?.id||user.disabled)throw new RequestError('Sign in to continue.',401)};
 async function preference(){
  if(!user?.id)return null;
  const rows=await db.AIPreference.filter({user_id:user.id},'-created_date',5);
  return rows[0]||null;
 }
 async function membership(){
  if(!user?.id)return null;
  const merchantId=String(Deno.env.get('ONLYCRYPTIDS_PAYPAL_MERCHANT_ID')||'').trim();
  if(!merchantId)return null; // Merchant email alone is NOT identity verification.
  const rows=await db.AIMembership.filter({user_id:user.id,site:'onlycryptids'},'-created_date',30);
  return rows.find(r=>r.provider==='paypal'&&r.provider_merchant_id===merchantId&&
   typeof r.provider_subscription_id==='string'&&r.provider_subscription_id.length>=6&&
   r.verified_payment===true&&r.status==='active'&&
   Number.isFinite(Date.parse(r.expires_at))&&Date.parse(r.expires_at)>Date.now()&&
   aiPlans.some(p=>p.id===r.plan_id&&p.monthlyCents>0))||null;
 }
 if(action==='ai-catalog'){
  const m=await membership();
  return ok({plans:aiPlans,merchant:aiMerchant,subscription:m?{plan_id:m.plan_id,expires_at:m.expires_at,status:m.status}:null,
    features:m?featuresForPlan(m.plan_id):[],checkout_enabled:false,generation_enabled:false,
    message:'AI subscriptions and model inference are not live yet. No payment can be made.'});
 }
 if(action==='ai-preferences'){
  auth();const p=await preference();
  return ok({learn_from_my_posts:p?.learn_from_my_posts===true,
    interests:Array.isArray(p?.interests)?p.interests:[],protected_terms:Array.isArray(p?.protected_terms)?p.protected_terms:[]});
 }
 if(action==='ai-preferences-save'){
  auth();
  const interests=Array.isArray(data.interests)?[...new Set(data.interests.filter(x=>typeof x==='string'&&aiAudienceInterests.includes(x)))].slice(0,10):[];
  const fields={user_id:user.id,learn_from_my_posts:data.learn_from_my_posts===true,
    interests,protected_terms:normalizeProtectedTerms(data.protected_terms),
    updated_at:new Date().toISOString()};
  const p=await preference();
  const saved=p?await db.AIPreference.update(p.id,fields):await db.AIPreference.create(fields);
  await audit('ai-preference-update',saved.id,'opt-in: '+fields.learn_from_my_posts);
  return ok({saved:true,...fields});
 }
 if(action==='ai-brief'){
  const p=await preference();
  const enabled=p?.learn_from_my_posts===true;
  let writingSamples=[];
  if(enabled&&user?.id){
   const own=await db.Post.filter({user_id:user.id,status:'published'},'-created_date',5);
   writingSamples=own.filter(q=>q.body&&q.label!=='AI-Generated').slice(0,3).map(q=>String(q.body).slice(0,350));
  }
  try{
   const brief=makeOnlyCryptidsBrief({...data,protectedTerms:[
     ...normalizeProtectedTerms(data.protectedTerms),...(p?.protected_terms||[])
   ]},{interests:p?.interests||[],writingSamples});
   return ok({brief,charged:false,model_called:false,image_analyzed:false});
  }catch(e){throw new RequestError(e instanceof Error?e.message:'Unable to prepare your brief.',400)}
 }
 if(action==='ai-generate'){
  auth();
  const mode=String(data.mode||'');
  if(!['story','photo-story','refine','art'].includes(mode))throw new RequestError('Invalid creation mode.');
  const m=await membership();
  if(!m||!featuresForPlan(m.plan_id).includes(mode))
   throw new RequestError('This requires a verified OnlyCryptids AI membership that includes the selected feature.',402);
  // Do not permit unmetered calls: before enabling, implement authenticated
  // PayPal webhook reconciliation, atomic job quotas, image storage and approved
  // provider budget. Missing infrastructure is always fail-closed.
  throw new RequestError('AI generation is awaiting provider and metering activation. No generation or charge occurred.',503);
 }
 throw new RequestError('Unknown AI action.',404);
}
