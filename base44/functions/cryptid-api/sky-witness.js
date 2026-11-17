import {proofreadText,buildWitnessAccount,fictionalCoda,SKY_COPYEDIT_VERSION} from './proofread.js';

const CONSENT='onlycryptids-sky-witness-report-2026-11-16-v1';
const TOPICS=['Satellites or unidentified objects','Supercomputers or artificial intelligence','Future technologies','Signals and related experiences'];
const PUBLIC_FIELDS=['id','headline','topic','event_date','time_of_day','location_region','weather','activity','appearance','object_behavior','altitude','other_witnesses','later_sightings','impact','source_notes','edited_account','contributor','fictional_coda','created_date'];
const publish=(record)=>Object.fromEntries(PUBLIC_FIELDS.map(k=>[k,record[k]]));
const clean=(v,max=1500)=>{if(typeof v!=='string')return '';const s=v.trim();if(s.length>max)throw new Error('A field exceeds its character limit.');return s};
const filled=(v,max)=>{const s=clean(v,max);if(!s)throw new Error('Please complete every required observation field.');return s};
const sha=async text=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(x=>x.toString(16).padStart(2,'0')).join('');
export async function skyWitnessAction({action,data,db,isElevated,headers}){
 const response=x=>Response.json(x,{headers});
 if(action==='sky-list'){
  const skip=Number(data.offset??0);
  if(!Number.isInteger(skip)||skip<0||skip>2000)throw new Error('Invalid page.');
  const rows=await db.SkyWitnessReport.filter({status:'published'},'-created_date',21,skip);
  return response({reports:rows.slice(0,20).map(x=>({id:x.id,headline:x.headline,topic:x.topic,contributor:x.contributor,location_region:x.location_region,event_date:x.event_date,created_date:x.created_date})),next_offset:rows.length>20?skip+20:null});
 }
 if(action==='sky-read'){
  const id=clean(data.id,100);
  if(!/^[A-Za-z0-9_.-]{1,100}$/.test(id))throw new Error('Invalid report identifier.');
  const row=await db.SkyWitnessReport.get(id);
  if(!row||row.status!=='published')return Response.json({error:'Report unavailable.'},{status:404,headers});
  return response({report:publish(row),fictional_ending:row.fictional_coda?fictionalCoda:null,edit_version:SKY_COPYEDIT_VERSION});
 }
 if(action==='sky-submit'){
  // Independent witness-report publication license. Does not change creator agreements or ownership.
  if(data.agreed!==true||data.accurate!==true||data.publish_consent!==true)throw new Error('Accuracy confirmation and explicit permission to publish are required.');
  if(data.website||data.hidden_field)throw new Error('Submission could not be processed.');
  if(!TOPICS.includes(data.topic))throw new Error('Choose a report topic.');
  const credit_mode=['name','anonymous'].includes(data.credit_mode)?data.credit_mode:null;
  if(!credit_mode)throw new Error('Choose how the report will be credited.');
  const contributor=credit_mode==='anonymous'?'Anonymous witness':filled(data.contributor,80);
  if(contributor==='Anonymous witness'&&credit_mode==='name')throw new Error('Choose a distinct credit name or submit anonymously.');
  const input={
   headline:filled(data.headline,140),topic:data.topic,contributor,credit_mode,
   original_account:filled(data.original_account,12000),
   appearance:filled(data.appearance,2500),
   object_behavior:filled(data.object_behavior,2500),
   activity:filled(data.activity,1500),
   other_witnesses:filled(data.other_witnesses,1500),
   later_sightings:filled(data.later_sightings,1500),
   impact:filled(data.impact,1500),
   event_date:filled(data.event_date,100),
   time_of_day:filled(data.time_of_day,100),
   location_region:filled(data.location_region,160),
   altitude:filled(data.altitude,250),
   weather:clean(data.weather,500),
   source_notes:clean(data.source_notes,2000),
   fictional_coda:data.fictional_coda===true
  };
  if(input.original_account.length<200)throw new Error('Please provide at least 200 characters of firsthand narrative before submitting.');
  const edited_account=proofreadText(buildWitnessAccount(input)).text;
  const fingerprint=await sha([input.original_account,input.appearance,input.object_behavior,input.contributor].join('|').toLowerCase().replace(/\s+/g,' ').trim());
  const existing=await db.SkyWitnessReport.filter({fingerprint},'-created_date',1);
  if(existing.length)throw new Error('This report has already been submitted. Please do not submit duplicates.');
  // Never expose private addresses or contact details automatically; divert those reports to moderation.
  const includesPrivateDetails=/(?:\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b|\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\b\d{1,5}\s+[\w.\s]{3,35}\s(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln)\b)/i.test(edited_account);
  const suspicious=/(?:https?:\/\/\S+){4,}/i.test(edited_account);
  const status=(includesPrivateDetails||suspicious)?'pending_review':'published';
  const row=await db.SkyWitnessReport.create({...input,edited_account,fingerprint,status,consent_version:CONSENT,reason:status==='published'?'':'Contact or private-location details require moderator review.'});
  return response({id:row.id,status,credit:row.contributor,link:status==='published'?'#sky-report='+encodeURIComponent(row.id):null,edit_version:SKY_COPYEDIT_VERSION});
 }
 if(action==='sky-modqueue'||action==='sky-moderate'){
  if(!isElevated)return Response.json({error:'Administrator access required.'},{status:403,headers});
  if(action==='sky-modqueue'){
   const rows=await db.SkyWitnessReport.filter({status:'pending_review'},'-created_date',100);
   return response({reports:rows.map(x=>({id:x.id,headline:x.headline,contributor:x.contributor,edited_account:x.edited_account,reason:x.reason}))});
  }
  if(!['published','hidden'].includes(data.status))throw new Error('Invalid moderation decision.');
  const id=clean(data.id,100);
  const row=await db.SkyWitnessReport.get(id);
  if(!row)throw new Error('Report not found.');
  await db.SkyWitnessReport.update(id,{status:data.status,reason:data.status==='hidden'?'Hidden by moderator':''});
  return response({id,status:data.status});
 }
 return null;
}
