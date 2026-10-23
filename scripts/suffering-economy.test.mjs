import test from 'node:test';
import assert from 'node:assert/strict';
import {creditPolicy,generationQuote,tipQuote} from '../base44/functions/cryptid-api/economy.js';
import {reconcileEarnings,payoutRequestPolicy} from '../base44/functions/cryptid-api/creator-finance.js';
import {buildMonthlyBoards,scoreProvisional} from '../base44/functions/cryptid-api/leaderboard.js';

test('new accounts receive 5 welcome credits only as an inactive policy, one credit per mode',()=>{
 assert.equal(creditPolicy.welcomeUnits,5);assert.equal(creditPolicy.aiGenerationUnits,1);
 for(const mode of ['story','photo-story','refine','art'])assert.deepEqual(generationQuote(mode),{mode,units:1,usdCents:25,chargeOn:'success',autoPublish:false});
 assert.throws(()=>generationQuote('unknown'));
});
test('only whole-number tips can be quoted',()=>{
 assert.equal(tipQuote(1).units,1);
 for(const value of [0,-1,0.5,'2',101])assert.throws(()=>tipQuote(value));
});
const baseEarning={provider:'paypal',source_type:'creator-subscription',currency:'USD',provider_merchant_id:'MERCHANT1',verified_payment:true,provider_status:'COMPLETED',status:'settled',provider_capture_id:'CAPTURE1',creator_amount_cents:700,gross_cents:1000,processor_fee_cents:100,platform_fee_cents:200,available_at:'2025-10-01T00:00:00Z'};
test('missing merchant means no available funds',()=>assert.equal(reconcileEarnings({earnings:[baseEarning]}).available_cents,0));
test('reconciliation ignores fake, mixed merchant, duplicate and unverified capture',()=>{
 const data=reconcileEarnings({merchantId:'MERCHANT1',earnings:[baseEarning,{...baseEarning,provider_capture_id:'CAPTURE2',verified_payment:false},{...baseEarning,provider_capture_id:'CAPTURE3',provider_merchant_id:'WRONG'},baseEarning],now:Date.parse('2026-10-23T00:00:00Z')});
 assert.equal(data.available_cents,700);assert.equal(data.untrusted_records,3);
});
test('earnings are held until available and refunds reduce balances',()=>{
 const d=reconcileEarnings({merchantId:'MERCHANT1',earnings:[{...baseEarning,available_at:'2099-01-01T00:00:00Z'},{...baseEarning,provider_capture_id:'CAPTURE4',refunded_cents:200}],now:Date.parse('2026-10-23T00:00:00Z')});
 assert.equal(d.pending_cents,700);assert.equal(d.available_cents,500);assert.equal(d.refunded_cents,200);
});
test('payouts reserve or settle funds exactly once',()=>{
 const history=[{id:'p1',provider:'paypal',currency:'USD',amount_cents:200,status:'requested'}, {id:'p2',provider:'paypal',currency:'USD',amount_cents:100,status:'completed',provider_item_id:'PAYMENT123',verified_payout:true}];
 const d=reconcileEarnings({merchantId:'MERCHANT1',earnings:[baseEarning],payouts:history,now:Date.parse('2026-10-23T00:00:00Z')});
 assert.equal(d.available_cents,400);assert.equal(d.committed_cents,200);assert.equal(d.paid_cents,100);
});
test('payout authorization remains off unless every independent control is approved',()=>{
 assert.equal(payoutRequestPolicy().enabled,false);
 assert.deepEqual(payoutRequestPolicy({accountVerified:true,marketplaceApproved:true,webhooksVerified:true,ledgerAtomic:true,payoutPermission:true}).missing,[]);
});
const creator={id:'creator1',user_id:'author',handle:'woods',display_name:'Woods',status:'active'};
const post={id:'post1',creator_id:'creator1',user_id:'author',title:'Shadow',format:'Story',label:'Fiction',status:'published',visibility:'free',created_date:'2026-10-02T10:00:00Z'};
const rating={user_id:'reader1',post_id:'post1',engagement:4,community_support:3,creativity:5,fear:5,cryptid:5};
test('top 10 is separated by medium and human versus AI, and has no prize winner',()=>{
 const ratings=['reader1','reader2','reader3'].map(user_id=>({...rating,user_id}));
 const b=buildMonthlyBoards({posts:[post,{...post,id:'post2',label:'AI-Generated',format:'Art'},{...post,id:'post3',visibility:'subscribers'},{...post,id:'post4',demo:true}],creators:[creator],ratings,month:'2026-10'});
 assert.equal(b.lanes['human-stories'].length,1);assert.equal(b.lanes['ai-images'].length,1);assert.equal(b.lanes['human-images'].length,0);assert.equal(b.prize_winner,null);
 assert.equal(b.lanes['human-stories'][0].ratings.cryptid,5);
});
test('paid tips do not affect provisional quality score or grant contest odds',()=>{
 const ratings=['reader1','reader2','reader3'].map(user_id=>({...rating,user_id}));
 const p={...post};
 const baseline=scoreProvisional({post:p,ratings});
 const tipped=scoreProvisional({post:p,ratings,tips:[{content_id:p.id,from_user_id:'donor',to_user_id:'author',status:'settled',units:100}]});
 assert.equal(baseline.provisional_score,tipped.provisional_score);
 assert.equal(tipped.tip_units,100);
});
