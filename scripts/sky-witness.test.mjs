import test from 'node:test';
import assert from 'node:assert/strict';
import {skyWitnessAction} from '../base44/functions/cryptid-api/sky-witness.js';
import {proofreadText,buildWitnessAccount} from '../base44/functions/cryptid-api/proofread.js';

class RequestError extends Error{constructor(message,status=400){super(message);this.status=status}}
function store(){
 const rows=[];
 const SkyWitnessReport={
  async create(r){const row={...r,id:'sky'+(rows.length+1),created_date:new Date().toISOString()};rows.unshift(row);return row},
  async filter(query,_sort,limit=100,skip=0){return rows.filter(r=>Object.entries(query).every(([key,val])=>r[key]===val)).slice(skip,skip+limit)},
  async get(id){return rows.find(r=>r.id===id)||null},
  async update(id,patch){const r=rows.find(r=>r.id===id);Object.assign(r,patch);return r}
 };
 const call=(action,data={},isElevated=false)=>skyWitnessAction({action,data,db:{SkyWitnessReport},isElevated,RequestError,headers:{}});
 return {rows,call};
}
const longAccount='At approximately dusk, I stood in a public area and watched a point of light move slowly across the cloudline. It appeared brighter than the neighboring stars and paused in my line of sight. I could not identify it and cannot estimate the distance accurately. I looked away for a few moments and the light was no longer visible.';
const sample={headline:'I watched a light cross the sky',topic:'Satellites or unidentified objects',event_date:'November 2026',time_of_day:'Dusk',location_region:'Pacific Northwest, USA',activity:'I was walking home.',appearance:'A bright white light moved quietly.',object_behavior:'It moved east and disappeared.',altitude:'Unknown',other_witnesses:'No one I could confirm.',later_sightings:'I did not see it again.',impact:'I went home and wrote down the details.',original_account:longAccount,credit_mode:'name',contributor:'Field Journal',accurate:true,publish_consent:true,agreed:true};
test('instant proofreading corrects common errors while preserving factual sentences',()=>{
 assert.equal(proofreadText('teh satelite flew by. i couldnt identify it.').text,"The satellite flew by. I couldn't identify it.");
 assert.ok(buildWitnessAccount(sample).includes('I was walking home.'));
});
test('anonymous consented eyewitness account publishes as unverified with credit and link',async()=>{
 const s=store();const res=await (await s.call('sky-submit',{...sample,credit_mode:'anonymous',contributor:'Ignored'})).json();
 assert.equal(res.status,'published');assert.equal(res.credit,'Anonymous witness');
 assert.equal(res.link,'#sky-report=sky1');
 const entry=await(await s.call('sky-read',{id:res.id})).json();
 assert.equal(entry.report.contributor,'Anonymous witness');
 assert.ok(entry.report.edited_account.includes('THE FIRSTHAND ACCOUNT'));
 assert.equal('original_account' in entry.report,false);
});
test('duplicate submissions are rejected and unpublished items never appear in public list',async()=>{
 const s=store();await s.call('sky-submit',sample);
 await assert.rejects(()=>s.call('sky-submit',sample),/already been submitted/);
 const listing=await(await s.call('sky-list')).json();assert.equal(listing.reports.length,1);
});
test('private contact details are held for moderation and only moderators can see queue',async()=>{
 const s=store();const response=await(await s.call('sky-submit',{...sample,original_account:longAccount+' You can reach me at personal@example.com.'})).json();
 assert.equal(response.status,'pending_review');assert.equal(response.link,null);
 const listing=await(await s.call('sky-list')).json();assert.equal(listing.reports.length,0);
 const privateView=await s.call('sky-read',{id:response.id});assert.equal(privateView.status,404);
 const queue=await(await s.call('sky-modqueue',{},true)).json();assert.equal(queue.reports.length,1);
 const denied=await s.call('sky-modqueue');assert.equal(denied.status,403);
});
test('fictional ending is opt-in, separately labeled and cannot be mistaken for evidence',async()=>{
 const s=store();const id=(await(await s.call('sky-submit',{...sample,fictional_coda:true})).json()).id;
 const report=await(await s.call('sky-read',{id})).json();
 assert.ok(report.fictional_ending.startsWith('FICTIONAL ATMOSPHERIC CODA'));
 assert.ok(!report.report.edited_account.includes('FICTIONAL ATMOSPHERIC CODA'));
 await s.call('sky-moderate',{id,status:'hidden'},true);
 const unavailable=await s.call('sky-read',{id});assert.equal(unavailable.status,404);
});
