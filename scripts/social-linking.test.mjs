import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeSocialLink,normalizeSocialProfiles,publicSocialLink,extractHashtags,externalShareUrl} from '../base44/functions/cryptid-api/social-links.js';
import {handleSocialAction} from '../base44/functions/cryptid-api/social-actions.js';

test('links official public profiles and communities safely',()=>{
 assert.equal(normalizeSocialLink('reddit','r/cryptids'),'https://www.reddit.com/r/cryptids/');
 assert.equal(normalizeSocialLink('reddit','u/mysteryfan'),'https://www.reddit.com/user/mysteryfan/');
 assert.equal(normalizeSocialLink('instagram','@night_stalker'),'https://www.instagram.com/night_stalker/');
 assert.equal(normalizeSocialLink('youtube','@MysteriesAtNight'),'https://www.youtube.com/@MysteriesAtNight');
 assert.equal(normalizeSocialLink('x','@MothmanWatch'),'https://x.com/MothmanWatch');
 assert.equal(normalizeSocialLink('threads','@mothwatch'),'https://www.threads.net/@mothwatch/');
 assert.deepEqual(normalizeSocialProfiles({x:'@mothmanwatch',facebook:''}),{x:'https://x.com/mothmanwatch'});
});
test('rejects lookalike domains, embedded credentials, non-HTTPS and unsafe protocols',()=>{
 for(const url of [
   'https://reddit.com.evil.example/r/cryptids',
   'http://www.reddit.com/r/cryptids',
   'javascript:alert(1)',
   'https://user:password@reddit.com/r/cryptids',
   'https://www.reddit.com/login',
   'https://www.youtube.com/redirect?next=evil.example'
 ])assert.throws(()=>normalizeSocialLink(url.includes('youtube')?'youtube':'reddit',url));
 assert.equal(publicSocialLink('javascript:alert(1)'),null);
 assert.equal(publicSocialLink('https://reddit.com.evil.example/r/cryptids'),null);
 assert.ok(publicSocialLink('https://www.reddit.com/r/cryptids/comments/abc123/'));
 assert.ok(publicSocialLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ'));
});
test('extracts unique case-insensitive tags and links to external share dialogs',()=>{
 assert.deepEqual(extractHashtags('A #Cryptids #cryptids and #mothman_2026 sighting.'),['cryptids','mothman_2026']);
 assert.match(externalShareUrl('reddit','Strange sighting','https://example.com/#post=1'),/reddit.com\/submit/);
 assert.match(externalShareUrl('x','Unsolved','https://example.com/#post=2'),/twitter.com\/intent/);
 assert.equal(externalShareUrl('youtube','Strange','https://example.com'),null);
});
test('mention-resolve chooses exact active member, then community, and never reveals banned profiles',async()=>{
 const creators=[{id:'c1',handle_key:'mysteryfan',user_id:'u1',status:'active'}];
 const groups=[{id:'g1',slug:'night_watch',user_id:'u2',name:'Night Watch',status:'active'}];
 const db={
  Creator:{filter:async q=>creators.filter(c=>c.handle_key===q.handle_key||c.handle===q.handle)},
  Community:{filter:async q=>groups.filter(g=>g.slug===q.slug)}
 };
 const opts={db,headers:{},RequestError:class extends Error{constructor(x,status){super(x);this.status=status}},isBlocked:async()=>false,teaser:x=>x,publicCreator:x=>x};
 const user=await handleSocialAction({...opts,action:'mention-resolve',data:{handle:'mysteryfan'}});
 assert.equal((await user.json()).kind,'member');
 const group=await handleSocialAction({...opts,action:'mention-resolve',data:{handle:'night_watch',kind:'community'}});
 assert.equal((await group.json()).kind,'community');
 await assert.rejects(()=>handleSocialAction({...opts,isBlocked:async()=>true,action:'mention-resolve',data:{handle:'mysteryfan',kind:'member'}}));
});
test('tag-feed includes only public published stories and discussions',async()=>{
 const posts=[
  {id:'p1',status:'published',visibility:'free',title:'Forest #strange',teaser:'A mystery',body:'Footsteps',user_id:'a'},
  {id:'p2',status:'published',visibility:'subscribers',title:'Private',teaser:'Nothing',body:'Secret #strange',user_id:'b'},
  {id:'p3',status:'hidden',visibility:'free',title:'#strange',user_id:'c'}
 ];
 const threads=[{id:'t1',title:'#strange at the old lake',body:'Question',status:'published',user_id:'d'}];
 const opts={action:'tag-feed',data:{tag:'strange'},headers:{},RequestError:class extends Error{},isBlocked:async()=>false,teaser:x=>x,
  db:{Post:{filter:async()=>posts.filter(x=>x.status==='published')},ForumThread:{filter:async()=>threads}}};
 const out=await (await handleSocialAction(opts)).json();
 assert.deepEqual(out.posts.map(x=>x.id),['p1']);
 assert.deepEqual(out.threads.map(x=>x.id),['t1']);
});
