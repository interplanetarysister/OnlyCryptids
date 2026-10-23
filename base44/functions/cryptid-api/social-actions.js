import {extractHashtags,validTag} from './social-links.js';

// Public navigation only. No social OAuth, privileged cross-posting or scraping.
export async function handleSocialAction({action,data,db,headers,RequestError,isBlocked,teaser,publicCreator}){
 const ok=value=>Response.json(value,{headers});
 if(action==='mention-resolve'){
  const raw=String(data.handle||'').trim().toLowerCase();
  if(!/^[a-z0-9_-]{3,30}$/.test(raw))throw new RequestError('Invalid member or community mention.',400);
  const kind=String(data.kind||'auto');
  if(!['auto','member','community'].includes(kind))throw new RequestError('Invalid mention kind.',400);
  if(kind!=='community'){
   const members=await db.Creator.filter({handle_key:raw},'-created_date',5);
   const legacy=members.length?members:await db.Creator.filter({handle:raw},'-created_date',5);
   const c=legacy.find(c=>c.status==='active');
   if(c&&!(await isBlocked(c.user_id)))return ok({kind:'member',creator:publicCreator(c)});
  }
  if(kind!=='member'){
   const communities=await db.Community.filter({slug:raw},'-created_date',5);
   const c=communities.find(c=>c.status==='active');
   if(c&&!(await isBlocked(c.user_id)))return ok({kind:'community',id:c.id,slug:c.slug,name:c.name});
  }
  throw new RequestError('That mention does not match an active member or community.',404);
 }
 if(action==='tag-feed'){
  const tag=String(data.tag||'').toLowerCase();
  if(!validTag(tag))throw new RequestError('Use a hashtag containing letters, numbers and underscores.',400);
  // Browse the most recent public source records without revealing a paid
  // story's private body or unlisted data. Pagination/extended indexing comes later.
  const [posts,threads]=await Promise.all([
   db.Post.filter({status:'published'},'-created_date',250),
   db.ForumThread.filter({status:'published'},'-created_date',250)
  ]);
  const visiblePosts=[];
  for(const p of posts){
   if(p.visibility!=='free'||await isBlocked(p.user_id))continue;
   const tags=[...(Array.isArray(p.hashtags)?p.hashtags:[]),...extractHashtags([p.title,p.teaser,p.body].join(' '))];
   if(tags.some(t=>String(t).toLowerCase()===tag))visiblePosts.push(teaser(p));
  }
  const visibleThreads=[];
  for(const t of threads){
   if(await isBlocked(t.user_id))continue;
   if(extractHashtags([t.title,t.body].join(' ')).includes(tag))
    visibleThreads.push({id:t.id,title:t.title,body_excerpt:String(t.body||'').slice(0,220),created_date:t.created_date,display_name:t.display_name,community_id:t.community_id,category:t.category});
  }
  return ok({tag,posts:visiblePosts.slice(0,50),threads:visibleThreads.slice(0,50),scope:'Most recent 250 published posts and 250 public discussions.',has_more:visiblePosts.length>50||visibleThreads.length>50});
 }
 throw new RequestError('Unsupported navigation action.',404);
}
