// Isolated authorization checks: no provider calls, signatures, or payments.
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {transformWithOxc} from 'vite';

let source=await readFile(new URL('../base44/functions/cryptid-api/index.ts',import.meta.url),'utf8');
source=source.replace(/^import .*;\n/gm,'');
const compiled=await transformWithOxc(source,'index.ts',{lang:'ts'});
async function run(action,payload={},options={}){
 let handler;const writes=[];
 const user=Object.hasOwn(options,'user')?options.user:{id:'reader',role:'user'};
 const post={id:'p1',user_id:'author',creator_id:'creator1',status:'published',visibility:'free',body:'protected body',...options.post};
 const comment={id:'c1',user_id:'commenter',post_id:'p1',body:'hello',status:'visible',...options.comment};
 const tables={Post:[post],Comment:[comment],...options.tables};
 const db=new Proxy({}, {get:(_,entity)=>({
  get:async(id)=>(tables[entity]||[]).find(row=>row.id===id)||null,
  list:async()=>(tables[entity]||[]),
  filter:async(query,sort,limit=1000,skip=0)=>(tables[entity]||[]).filter(row=>Object.entries(query).every(([key,value])=>row[key]===value)).slice(skip,skip+limit),
  update:async(id,fields)=>{writes.push({entity,id,fields});return {...fields,id}},
  create:async(fields)=>{writes.push({entity,fields});return {...fields,id:'new'}},
 })});
 const sandbox={Deno:{serve:fn=>{handler=fn}},Response,TextEncoder,crypto:webcrypto,console,
  createClientFromRequest:()=>({auth:{me:async()=>user},asServiceRole:{entities:db}}),
  renderCreatorLicense:()=>'',licenseReady:()=>options.agreementReady===true,licenseVersion:'test'};
 vm.runInNewContext(compiled.code,sandbox);
 const response=await handler(new Request('https://example.invalid',{method:'POST',body:JSON.stringify({action,...payload})}));
 return {status:response.status,data:await response.json(),writes};
}
let result=await run('comment-remove',{id:'c1'});
assert.equal(result.status,403);assert.equal(result.writes.length,0);
result=await run('comment-remove',{id:'c1'},{user:null});
assert.equal(result.status,401);assert.equal(result.writes.length,0);
for(const id of ['commenter','author']){
 result=await run('comment-remove',{id:'c1'},{user:{id,role:'user'}});
 assert.equal(result.status,200);
 assert.equal(result.writes[0].fields.status,'removed');
 assert.equal(result.writes[1].entity,'AuditEvent');
}
result=await run('comment-remove',{id:'c1'},{user:{id:'moderator',role:'admin'}});
assert.equal(result.status,200);
result=await run('post',{id:'p1'},{post:{status:'deleted'},user:{id:'author',role:'user'}});
assert.equal(result.status,403);assert.equal(result.data.post,undefined);
result=await run('post',{id:'p1'},{post:{visibility:'subscribers'}});
assert.equal(result.status,403);assert.equal(result.data.post,undefined);
result=await run('post',{id:'p1'});
assert.equal(result.data.comments[0].can_remove,false);
result=await run('post',{id:'p1'},{user:{id:'author',role:'user'}});
assert.equal(result.data.comments[0].can_remove,true);
const thread={id:'t1',user_id:'author',title:'Original lore',body:'forum body',status:'published'};
const reply={id:'r1',user_id:'commenter',thread_id:'t1',body:'reply body',status:'visible'};
const tables={ForumThread:[thread],ForumReply:[reply]};
result=await run('forum-create',{title:'Title',body:'Text'},{user:null});
assert.equal(result.status,401);assert.equal(result.writes.length,0);
result=await run('forum-create',{title:'Title',body:'Text'});
assert.equal(result.status,409);assert.equal(result.writes.length,0);
result=await run('forum-thread',{id:'t1'},{tables:{...tables,UserBlock:[{user_id:'author',target_user_id:'reader'}]}});
assert.equal(result.status,404);assert.equal(result.data.thread,undefined);
result=await run('forum-thread',{id:'t1'},{tables:{ForumThread:[{...thread,status:'hidden'}]}});
assert.equal(result.status,404);
result=await run('forum-remove',{id:'r1',kind:'reply'},{tables});
assert.equal(result.status,403);assert.equal(result.writes.length,0);
for(const id of ['commenter','author']){
 result=await run('forum-remove',{id:'r1',kind:'reply'},{tables,user:{id,role:'user'}});
 assert.equal(result.status,200);assert.equal(result.writes[0].entity,'ForumReply');assert.equal(result.writes[0].fields.status,'removed');
}
result=await run('forum-vote',{id:'t1'},{tables,user:{id:'author',role:'user'}});
assert.equal(result.status,400);assert.equal(result.writes.length,0);
result=await run('forum-list',{offset:-1});assert.equal(result.status,400);
result=await run('forum-list',{}, {tables:{...tables,UserBlock:[{user_id:'reader',target_user_id:'author'}]}});
assert.equal(result.data.threads.length,0);
result=await run('post',{id:'p1'},{tables:{UserBlock:[{user_id:'author',target_user_id:'reader'}]}});
assert.equal(result.status,403);assert.equal(result.data.post,undefined);
result=await run('notification-read',{id:'n1'},{tables:{Notification:[{id:'n1',user_id:'someone-else'}]}});
assert.equal(result.status,404);assert.equal(result.writes.length,0);
result=await run('notification-read',{id:'n1'},{tables:{Notification:[{id:'n1',user_id:'reader'}]}});
assert.equal(result.status,200);assert.equal(result.writes[0].fields.read,true);
result=await run('unblock',{id:'b1'},{tables:{UserBlock:[{id:'b1',user_id:'someone-else',target_user_id:'author'}]}});
assert.equal(result.status,404);assert.equal(result.writes.length,0);
result=await run('forum-report',{thread_id:'t1',reply_id:'r1',reason:'Review'},{tables:{...tables,ForumReply:[{...reply,thread_id:'another'}]}});
assert.equal(result.status,404);assert.equal(result.writes.length,0);
result=await run('moderate',{id:'report1',decision:'hide'},{user:{id:'admin',role:'admin'},tables:{Report:[{id:'report1',forum_reply_id:'r1',forum_thread_id:'t1'}]}});
assert.equal(result.status,200);assert.equal(result.writes[0].entity,'ForumReply');assert.equal(result.writes[0].fields.status,'hidden');
result=await run('moderate',{id:'report1',decision:'hide'},{tables:{Report:[{id:'report1',forum_thread_id:'t1'}]}});
assert.equal(result.status,403);assert.equal(result.writes.length,0);
const signed={user_id:'reader',agreement_hash:'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',version:'test',status:'signed',id:'signature1'};
result=await run('forum-create',{title:'New folklore question',body:'What did you notice?',user_id:'victim',display_name:'Impersonated'}, {agreementReady:true,tables:{CreatorLicenseSignature:[signed]}});
assert.equal(result.status,200);assert.equal(result.writes[0].entity,'ForumThread');assert.equal(result.writes[0].fields.user_id,'reader');assert.equal(result.writes[0].fields.display_name,'Community member');assert.equal(result.writes[0].fields.license_signature_id,'signature1');
result=await run('forum-reply',{thread_id:'t1',body:'My original reply'}, {agreementReady:true,tables:{...tables,CreatorLicenseSignature:[signed]}});
assert.equal(result.status,200);assert.equal(result.writes[0].entity,'ForumReply');assert.equal(result.writes[0].fields.thread_id,'t1');assert.equal(result.writes[0].fields.license_signature_id,'signature1');
result=await run('forum-list',{}, {tables:{ForumThread:Array.from({length:21},(_,i)=>({...thread,id:`t${i}`}))}});
assert.equal(result.data.threads.length,20);assert.equal(result.data.next_offset,20);
result=await run('forum-create',{title:'Title',body:'Body'}, {agreementReady:true,tables:{CreatorLicenseSignature:[{...signed,version:'old-version'}]}});
assert.equal(result.status,403);assert.equal(result.writes.length,0);
console.log('30 authorization and forum checks passed; no external services invoked.');
