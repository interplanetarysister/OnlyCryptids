// Shared, strict OnlyCryptids social-link policy. Profile links are NOT OAuth grants.
export const recognizedNetworks=Object.freeze([
 {id:'reddit',label:'Reddit',hint:'u/username or r/community'},
 {id:'youtube',label:'YouTube',hint:'@channel or channel URL'},
 {id:'x',label:'X / Twitter',hint:'@username'},
 {id:'instagram',label:'Instagram',hint:'@username'},
 {id:'facebook',label:'Facebook',hint:'Page or public profile'},
 {id:'threads',label:'Threads',hint:'@username'},
 {id:'bluesky',label:'Bluesky',hint:'name.bsky.social'},
 {id:'tumblr',label:'Tumblr',hint:'blogname.tumblr.com'}
]);
const allowedHosts=Object.freeze({
 reddit:['reddit.com','www.reddit.com','old.reddit.com'],
 youtube:['youtube.com','www.youtube.com','m.youtube.com'],
 x:['x.com','www.x.com','twitter.com','www.twitter.com'],
 instagram:['instagram.com','www.instagram.com'],
 facebook:['facebook.com','www.facebook.com','m.facebook.com'],
 threads:['threads.net','www.threads.net'],
 bluesky:['bsky.app','www.bsky.app'],
 tumblr:['tumblr.com','www.tumblr.com']
});
const safeSlug=v=>/^[a-zA-Z0-9_.-]{2,64}$/.test(v);
export function normalizeSocialLink(network,value){
 const raw=String(value||'').trim();
 if(!raw)return '';
 if(raw.length>300||/[\u0000-\u001f\u007f<>]/.test(raw))throw new Error('Social profile link is invalid.');
 if(!Object.hasOwn(allowedHosts,network))throw new Error('Unsupported social platform.');
 const clean=raw.replace(/^@/,'');
 if(!/^https?:\/\//i.test(raw)){
  if(network==='reddit'){
   const m=/^(?:u\/|user\/|r\/)?([A-Za-z0-9_-]{3,21})$/.exec(clean);
   if(!m)throw new Error('Enter a Reddit user or r/community.');
   const prefix=raw.startsWith('r/')?'r':'user';
   return 'https://www.reddit.com/'+prefix+'/'+m[1]+'/';
  }
  if(network==='youtube'&&/^[a-zA-Z0-9_.-]{3,30}$/.test(clean))return 'https://www.youtube.com/@'+clean;
  if(network==='x'&&/^[A-Za-z0-9_]{1,15}$/.test(clean))return 'https://x.com/'+clean;
  if((network==='instagram'||network==='threads')&&/^[A-Za-z0-9._]{1,30}$/.test(clean))return 'https://www.'+(network==='threads'?'threads.net':'instagram.com')+'/@'.repeat(network==='threads')+clean+'/';
  if(network==='facebook'&&safeSlug(clean))return 'https://www.facebook.com/'+clean;
  if(network==='bluesky'&&/^[a-zA-Z0-9.-]{4,90}$/.test(clean))return 'https://bsky.app/profile/'+clean;
  if(network==='tumblr'&&/^[a-zA-Z0-9-]{3,32}(?:\.tumblr\.com)?$/.test(clean)){
   const name=clean.replace(/\.tumblr\.com$/,'');return 'https://www.tumblr.com/'+name;
  }
  throw new Error('Use an official public profile URL for '+network+'.');
 }
 let u;try{u=new URL(raw)}catch{throw new Error('Invalid social link URL.')}
 if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash)throw new Error('Use a public HTTPS link without credentials or fragments.');
 if(!allowedHosts[network].includes(u.hostname.toLowerCase()))throw new Error('The link must belong to '+network+' on its official domain.');
 if(u.search)throw new Error('Remove tracking parameters from the social link.');
 if(u.pathname==='/'||u.pathname.length>160)throw new Error('Enter a specific public profile, channel or community.');
 const segments=u.pathname.split('/').filter(Boolean);
 if(segments.length>3||segments.some(s=>!safeSlug(s.replace(/^@/,''))||s==='..'||s==='.'))throw new Error('Invalid social profile path.');
 const first=segments[0].toLowerCase();
 if(['settings','login','signup','messages','api','oauth','redirect','share','sharer','intent','compose','submit'].includes(first))throw new Error('Link to a public profile or community, not an app action.');
 if(network==='reddit'&&!['r','u','user'].includes(first))throw new Error('Link to Reddit r/community or u/username.');
 if(network==='reddit'&&segments.length!==2)throw new Error('Enter the Reddit community or user page.');
 if(network==='youtube'&&!(first.startsWith('@')||['channel','c','user','playlist'].includes(first)))throw new Error('Enter a YouTube channel page.');
 if(network==='instagram'&&segments.length!==1)throw new Error('Enter an Instagram profile, not an individual post.');
 if(network==='x'&&segments.length!==1)throw new Error('Enter an X user profile.');
 if(network==='threads'&&(!first.startsWith('@')||segments.length!==1))throw new Error('Enter a Threads account.');
 if(network==='bluesky'&&(first!=='profile'||segments.length!==2))throw new Error('Enter a Bluesky profile.');
 if(network==='tumblr'&&segments.length!==1)throw new Error('Enter a Tumblr blog.');
 return 'https://'+u.hostname.toLowerCase()+u.pathname.replace(/\/+$/,'')+(u.pathname.endsWith('/')?'/':'');
}
export function normalizeSocialProfiles(input={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Invalid profile links.');
 const output={};
 for(const {id} of recognizedNetworks){
  const link=normalizeSocialLink(id,input[id]);
  if(link)output[id]=link;
 }
 return output;
}
export function publicSocialLink(raw){
 if(typeof raw!=='string'||raw.length>400)return null;
 let u;try{u=new URL(raw)}catch{return null}
 if(u.protocol!=='https:'||u.username||u.password||u.port||u.hash)return null;
 if(u.searchParams.has('access_token')||u.searchParams.has('token'))return null;
 if(u.hostname.toLowerCase()==='youtu.be'&&/^\/[A-Za-z0-9_-]{6,20}$/.test(u.pathname))return u.href;
 for(const hosts of Object.values(allowedHosts))if(hosts.includes(u.hostname.toLowerCase()))return u.href;
 return null;
}
export function validTag(value){
 return /^[a-z][a-z0-9_]{0,39}$/.test(String(value||'').toLowerCase());
}
export function extractHashtags(value){
 const found=new Set();
 for(const match of String(value||'').matchAll(/(?:^|[^\w])#([a-z][a-z0-9_]{0,39})(?![a-z0-9_])/gi)){
  found.add(match[1].toLowerCase());if(found.size>=12)break;
 }
 return [...found];
}
export function externalShareUrl(platform,title,url){
 const link=encodeURIComponent(url),label=encodeURIComponent(title||'Read this strange story on OnlyCryptids');
 if(platform==='reddit')return 'https://www.reddit.com/submit?url='+link+'&title='+label;
 if(platform==='x')return 'https://twitter.com/intent/tweet?url='+link+'&text='+label;
 if(platform==='facebook')return 'https://www.facebook.com/sharer/sharer.php?u='+link;
 return null;
}
