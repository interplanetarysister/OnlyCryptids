// Only Cryptids: authoritative access, community and Suffering offer API.
import {createClientFromRequest} from 'npm:@base44/sdk';
import {licenseVersion,renderCreatorLicense,licenseReady} from './license.js';
import {creditPolicy,creditPacks,creditCost,generationQuote,tipQuote} from './economy.js';
import {reconcileEarnings} from './creator-finance.js';
import {buildMonthlyBoards,scoreCategories,starRange} from './leaderboard.js';
import {cryptidTaxonomy,validSubcategory} from './taxonomy.js';
import {normalizeSocialProfiles,recognizedNetworks,extractHashtags} from './social-links.js';
import {handleSocialAction} from './social-actions.js';

class RequestError extends Error {status:number;constructor(message:string,status=400){super(message);this.status=status}}
function text(v:unknown,max:number,required=false){if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw new RequestError('Please check the required fields and their length.');return v.trim()}
function socialProfiles(input:any){try{return normalizeSocialProfiles(Object.fromEntries(recognizedNetworks.map(n=>[n.id,input['social_'+n.id]||''])))}catch(e){throw new RequestError(e instanceof Error?e.message:'Invalid public profile URL.',400)}}
function choose(v:unknown,values:string[],fallback:string){const value=v??fallback;if(!values.includes(value as string))throw new RequestError('Invalid selection.');return value}
function publicCreator(c:any){return {id:c.id,user_id:c.user_id,display_name:c.display_name,handle:c.handle,bio:c.bio,category:c.category,price:c.price,color:c.color,avatar:c.avatar,social_links:c.social_links||{},demo:c.demo===true,platform_owned:c.platform_owned===true,owner_name:c.platform_owned?'Interplanetary Association':undefined,revenue_purpose:c.platform_owned?'moderation_costs':undefined}}
function evidence(p:any){return {observation_context:p.observation_context||'',evidence_notes:p.evidence_notes||'',alternative_explanations:p.alternative_explanations||'',source_url:p.source_url||''}}
function sourceUrl(value:unknown){const s=text(value||'',1000);if(!s)return '';try{const u=new URL(s);if(u.protocol!=='https:'||u.username||u.password)throw new Error();return u.href}catch{throw new RequestError('Use a valid HTTPS original-source link without credentials.')}}
function teaser(p:any){return {id:p.id,hashtags:p.hashtags||[],section:p.section||'main',deep_category:p.deep_category||'',creator_id:p.creator_id,title:p.title,teaser:p.teaser,category:p.category,subcategory:p.subcategory,format:p.format,label:p.label,visibility:p.visibility,price_suffering:p.price_suffering,status:p.status,created_date:p.created_date,demo:p.demo===true,scene:p.scene,section:p.section||'main',deep_category:p.deep_category||'',hashtags:Array.isArray(p.hashtags)?p.hashtags:[],sighting_enabled:p.sighting_enabled===true,sighting_latitude:p.sighting_enabled?p.sighting_latitude:undefined,sighting_longitude:p.sighting_enabled?p.sighting_longitude:undefined,sighting_precision:p.sighting_precision,encounter_date:p.encounter_date,sighting_place:p.sighting_place}}
const categories=['Bigfoot','Mothman','Lake monsters','Chupacabra','Jersey Devil','Sea creatures','Unidentified'];
const formats=['Story','Photo','Video','Audio','Art','Research'];
const labels=['Claimed Encounter','Fiction','Art','Research/Commentary','AI-Generated'];
const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};

Deno.serve(async req=>{
 try{
  if(req.method!=='POST')throw new RequestError('Method not allowed.',405);
  if(Number(req.headers.get('content-length')||0)>65536)throw new RequestError('Request is too large.',413);
  const raw=await req.text();if(raw.length>65536)throw new RequestError('Request is too large.',413);
  const data=JSON.parse(raw);const action=text(data.action,40,true);
  const client=createClientFromRequest(req);const db=client.asServiceRole.entities;
  let user:any=null;try{user=await client.auth.me()}catch{}
  if(user?.disabled)user=null;
  // Super-admin access is derived from the authenticated account, never a typed username or email.
  const operatorEmails=new Set(['interplanetarysister@gmail.com','unrewound@gmail.com','cuddlemeplatonically@gmail.com']);
  const isOperator=Boolean(user?.id&&user?.email&&operatorEmails.has(String(user.email).trim().toLowerCase())&&user.is_verified===true);
  const isElevated=Boolean(user&&(['admin','super_admin'].includes(user.role)||isOperator));
  function auth(){if(!user||user.disabled)throw new RequestError('Sign in to continue.',401);return user}
  function admin(){auth();if(!isElevated)throw new RequestError('Administrator access required.',403)}
  let blockedUsers:Set<string>|null=null;
  async function blocks(){if(blockedUsers)return blockedUsers;blockedUsers=new Set();if(user&&!user.disabled){const [outgoing,incoming]=await Promise.all([db.UserBlock.filter({user_id:user.id},'-created_date',1000),db.UserBlock.filter({target_user_id:user.id},'-created_date',1000)]);for(const b of outgoing)blockedUsers.add(b.target_user_id);for(const b of incoming)blockedUsers.add(b.user_id)}return blockedUsers}
  async function isBlocked(id:string){return (await blocks()).has(id)}
  async function audit(name:string,target_id='',details=''){await db.AuditEvent.create({user_id:user?.id||'visitor',action:name,target_id,details})}
  async function licenseContext(){const rows=await db.PlatformSettings.list('-created_date',1);const settings=rows[0]||{};const agreement=renderCreatorLicense(settings);const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(agreement)))).map(b=>b.toString(16).padStart(2,'0')).join('');return {settings,text:agreement,hash,version:licenseVersion,ready:licenseReady(settings)}}
  async function requireLicense(){auth();const context=await licenseContext();if(!context.ready)throw new RequestError('Publishing is awaiting the completed Creator Copyright Assignment.',409);const records=await db.CreatorLicenseSignature.filter({user_id:user.id,agreement_hash:context.hash,version:context.version,status:'signed'});if(!records[0])throw new RequestError('Review and sign the Creator Copyright Assignment before publishing.',403);return records[0]}
  async function creator(){auth();const rows=await db.Creator.filter({user_id:user.id});if(!rows[0]||rows[0].status!=='active')throw new RequestError('Set up your creator profile first.',403);return rows[0]}
  async function memberProfile(){auth();const rows=await db.Creator.filter({user_id:user.id});if(rows[0]){if(rows[0].status!=='active')throw new RequestError('This profile is suspended.',403);return rows[0]}return db.Creator.create({user_id:user.id,display_name:user.full_name||'Community member',handle:`u_${user.id.replace(/[^a-z0-9]/gi,'').slice(0,28).toLowerCase()}`,category:'Unidentified',price:5,status:'active',avatar:'OC',color:'#a8c98e'})}
  async function publishingProfile(id:unknown){if(!id)return memberProfile();auth();const c=await db.Creator.get(text(id,100,true));if(!c||c.status!=='active'||!(c.user_id===user.id||(c.platform_owned===true&&isElevated)))throw new RequestError('You cannot publish through that profile.',403);return c}
  async function monetizationVerified(){auth();const token=req.headers.get('authorization');if(!token)return false;const session_hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(b=>b.toString(16).padStart(2,'0')).join('');const rows=await db.CreatorVerification.filter({user_id:user.id,session_hash,status:'verified',mfa_enrolled:true});return rows.some(r=>Date.parse(r.expires_at)>Date.now()&&Date.parse(r.expires_at)<=Date.now()+15*60*1000)}
  async function requireMonetization(){if(!await monetizationVerified())throw new RequestError('Monetization requires a verified two-factor session. Verification setup is not connected yet; free posts and comments do not require this check.',403)}
  function subcategory(category:string,value:unknown){const v=text(value||'',100);if(!validSubcategory(category,v))throw new RequestError('Choose a subcategory for the selected cryptid.');return v}
  function units(value:unknown){if(typeof value!=='number'||!Number.isSafeInteger(value)||value<1||value>100000)throw new RequestError('Choose a whole number of Suffering from 1 to 100,000.');return value}
  function publicPlan(p:any){return {id:p.id,creator_id:p.creator_id,name:p.name,description:p.description,price_suffering:p.price_suffering,period_days:p.period_days,status:p.status,revision:p.revision}}
  async function canRead(p:any){if(!p||['hidden','deleted'].includes(p.status)||await isBlocked(p.user_id))return false;if(isElevated||(user&&p.user_id===user.id))return true;if(p.status!=='published')return false;if(p.visibility==='free')return true;if(!user)return false;if(p.visibility==='premium'){const purchases=await db.PremiumPurchase.filter({user_id:user.id,post_id:p.id,verified_payment:true,status:'completed'});return purchases.some(r=>r.creator_id===p.creator_id&&Boolean(r.ledger_transaction_id))}if(p.visibility!=='subscribers')return false;const rows=await db.Subscription.filter({user_id:user.id,creator_id:p.creator_id,verified_payment:true});return rows.some(s=>['active','cancel_at_period_end'].includes(s.status)&&Date.parse(s.expires_at)>Date.now())}
  async function forumThread(id:string){const t=await db.ForumThread.get(id);if(!t||t.status!=='published'||await isBlocked(t.user_id))throw new RequestError('Discussion unavailable.',404);return t}
  function publicThread(t:any){return {id:t.id,title:t.title,body:t.body,category:t.category,subcategory:t.subcategory,label:t.label,display_name:t.display_name,created_date:t.created_date,community_id:t.community_id,locked:t.locked===true,pinned:t.pinned===true,can_remove:Boolean(user&&(t.user_id===user.id||isElevated))}}
  async function community(id:string){const c=await db.Community.get(id);if(!c||c.status!=='active')throw new RequestError('Community unavailable.',404);return c}
  async function communityRole(c:any){if(!user||user.disabled)return 'visitor';if(c.user_id===user.id)return 'owner';if(isElevated)return 'admin';const rows=await db.CommunityMember.filter({community_id:c.id,user_id:user.id});if(rows.some(m=>m.status==='banned'))return 'banned';return rows.some(m=>m.status==='active'&&m.role==='moderator')?'moderator':rows.some(m=>m.status==='active')?'member':'visitor'}
  async function member(c:any){auth();const role=await communityRole(c);if(!['owner','admin','moderator','member'].includes(role))throw new RequestError('Join this community before participating. Banned accounts cannot participate.',403);return role}
  async function moderator(c:any){auth();const role=await communityRole(c);if(!['owner','admin','moderator'].includes(role))throw new RequestError('Community moderator access required.',403);return role}
  function publicCommunity(c:any){return {id:c.id,name:c.name,slug:c.slug,description:c.description,rules:c.rules,social_links:c.social_links||{}}}
  function offset(v:unknown){const n=Number(v??0);if(!Number.isInteger(n)||n<0||n>10000)throw new RequestError('Invalid page.');return n}
  const ok=(value:any)=>Response.json(value,{headers});

  // Only app-user grants may authorize member publishing; shared app tokens cannot.
  const metaEnv={facebook:'CRYPTIDS_FACEBOOK_PAGES_APP_USER_CONNECTOR_ID',instagram:'CRYPTIDS_INSTAGRAM_APP_USER_CONNECTOR_ID'};
  const metaId=(v:unknown)=>{const s=String(v||'').trim();if(!/^[0-9]{5,30}$/.test(s))throw new RequestError('Invalid provider account.');return s};
  async function metaRequest(host:string,path:string,token:string,form?:URLSearchParams){
    const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
    try{
      const r=await fetch(host+path,{method:form?'POST':'GET',redirect:'error',signal:ctrl.signal,
        headers:{Authorization:'Bearer '+token,Accept:'application/json',...(form?{'Content-Type':'application/x-www-form-urlencoded'}:{})},...(form?{body:form}:{})});
      const json=await r.json().catch(()=>null);
      if(!r.ok||!json||json.error)throw new RequestError('The provider did not authorize that action. Check your connection and permissions.',502);
      return json;
    }catch(e){if(e instanceof RequestError)throw e;throw new RequestError('The social platform could not confirm the request. Check before retrying.',502)}
    finally{clearTimeout(timer)}
  }
  async function metaSession(platform:'facebook'|'instagram'){
    const connector_id=Deno.env.get(metaEnv[platform])||'';
    if(!connector_id)return {configured:false,connected:false,publish_ready:false,reason:'Member account linking is not configured.'};
    let conn:any;try{conn=await client.asServiceRole.connectors.getCurrentAppUserConnection(connector_id)}catch{}
    if(!conn?.accessToken)return {configured:true,connected:false,publish_ready:false,connector_id,reason:'Connect your account to Cryptids first.'};
    const token=String(conn.accessToken);
    try{
      if(platform==='facebook'){
        const permissions=await metaRequest('https://graph.facebook.com','/v26.0/me/permissions',token);
        const grants=new Set((Array.isArray(permissions.data)?permissions.data:[]).filter((v:any)=>v.status==='granted').map((v:any)=>String(v.permission||'')));
        const p=await metaRequest('https://graph.facebook.com','/v26.0/me/accounts?fields=id,name,tasks,access_token&limit=100',token);
        const pages=(Array.isArray(p.data)?p.data:[]).filter((v:any)=>/^[0-9]{5,30}$/.test(String(v.id||''))&&!!v.access_token&&Array.isArray(v.tasks)&&v.tasks.some((t:string)=>['CREATE_CONTENT','MANAGE'].includes(t)));
        const ready=grants.has('pages_manage_posts')&&grants.has('pages_show_list')&&pages.length>0;
        return {configured:true,connected:true,publish_ready:ready,connector_id,pages:pages.map((v:any)=>({id:String(v.id),name:String(v.name||'Facebook Page').slice(0,100)})),_pages:pages,reason:ready?'':'Page publishing permission or Page selection is missing.'};
      }
      const p=await metaRequest('https://graph.instagram.com','/v26.0/me?fields=id,username,account_type',token);
      const type=String(p.account_type||'').toUpperCase();
      const ready=['BUSINESS','MEDIA_CREATOR','CREATOR'].includes(type);
      return {configured:true,connected:!!p.id,publish_ready:ready,connector_id,id:metaId(p.id),username:String(p.username||'').slice(0,100),account_type:type,_token:token,reason:ready?'':'An Instagram Business or Creator account is needed for API publishing.'};
    }catch{return {configured:true,connected:false,publish_ready:false,connector_id,reason:'The provider account could not be verified. Reconnect it.'}}
  }
  if(action==='meta-status'){
    auth();const [facebook,instagram]=await Promise.all([metaSession('facebook'),metaSession('instagram')]);
    function safe(v:any){const {configured,connected,publish_ready,connector_id,pages,id,username,account_type,reason}=v;return {configured,connected,publish_ready,connector_id,pages,id,username,account_type,reason}}
    return ok({facebook:safe(facebook),instagram:safe(instagram)});
  }
  if(action==='meta-publish'){
    auth();
    const platform=choose(data.platform,['facebook','instagram'],'facebook') as 'facebook'|'instagram';
    const p=await db.Post.get(text(data.post_id,100,true));
    if(!p||p.user_id!==user.id||p.status!=='published')throw new RequestError('Choose one of your own published posts.',403);
    if(data.rights_confirmed!==true)throw new RequestError('Confirm that you have the right to share this post and its image.');
    const session:any=await metaSession(platform);
    if(!session.publish_ready)throw new RequestError(session.reason||'Connect the provider and grant posting permission.',409);
    const destination=platform==='facebook'?metaId(data.page_id):metaId(session.id);
    const page=platform==='facebook'?session._pages.find((v:any)=>String(v.id)===destination):null;
    if(platform==='facebook'&&!page)throw new RequestError('Select a Page you have permission to publish to.',403);
    const prior=(await db.SocialPublication.filter({user_id:user.id,post_id:p.id,platform,destination_id:destination}))[0];
    let image_url='';
    if(platform==='instagram'&&!(prior?.status==='processing'&&prior.container_id)){
      image_url=text(data.image_url,1500,true);
      try{
        const u=new URL(image_url),h=u.hostname.toLowerCase();
        if(u.protocol!=='https:'||u.username||u.password||u.port||!h.includes('.')||h==='localhost'||h.endsWith('.local')||h.endsWith('.internal')||/^[0-9]+[.][0-9]+[.][0-9]+[.][0-9]+$/.test(h))throw new Error();
      }catch{throw new RequestError('Instagram publishing needs a public HTTPS image URL.')}
    }
    if(prior&&!(platform==='instagram'&&prior.status==='processing'&&prior.container_id)){
      return ok({status:prior.status,success:prior.status==='published',external_post_id:prior.status==='published'?prior.external_post_id:undefined,message:prior.status==='published'?'This post has already been published to this account.':'Previous submission may have reached the provider. Check there before retrying.'});
    }
    const url='https://onlycryptids.base44.app/#post='+encodeURIComponent(p.id);
    const caption=[String(p.title||''),String(p.teaser||''),url].filter(Boolean).join(String.fromCharCode(10,10)).slice(0,2100);
    const log=prior||await db.SocialPublication.create({user_id:user.id,post_id:p.id,platform,destination_id:destination,status:'pending',container_id:'',external_post_id:'',created_at:new Date().toISOString(),completed_at:''});
    try{
      let external='';
      if(platform==='facebook'){
        const result=await metaRequest('https://graph.facebook.com','/v26.0/'+destination+'/feed',String(page.access_token),new URLSearchParams({message:caption}));
        external=String(result.id||'');
      }else{
        let containerId=String(log.container_id||'');
        if(!containerId){
          const created=await metaRequest('https://graph.instagram.com','/v26.0/'+destination+'/media',session._token,new URLSearchParams({image_url,caption}));
          containerId=metaId(created.id);
          await db.SocialPublication.update(log.id,{status:'processing',container_id:containerId});
        }
        const result=await metaRequest('https://graph.instagram.com','/v26.0/'+containerId+'?fields=status_code',session._token);
        if(result.status_code!=='FINISHED')return ok({success:false,status:'processing',message:'Instagram is preparing your image. Return and press Publish again to finish this same upload.'});
        const published=await metaRequest('https://graph.instagram.com','/v26.0/'+destination+'/media_publish',session._token,new URLSearchParams({creation_id:containerId}));
        external=String(published.id||'');
      }
      if(!/^[0-9]{5,30}(_[0-9]{5,30})?$/.test(external))throw new RequestError('Provider did not confirm a new post ID.',502);
      await db.SocialPublication.update(log.id,{status:'published',external_post_id:external,completed_at:new Date().toISOString()});
      await audit('meta-publish',p.id,platform);
      return ok({success:true,status:'published',external_post_id:external});
    }catch(error){
      // Do not repeat an ambiguous provider request automatically.
      await db.SocialPublication.update(log.id,{status:'uncertain'}).catch(()=>{});
      throw error;
    }
  }
  if(action==='auth-login'){
   const identity=text(data.identity,254,true).toLowerCase();if(typeof data.password!=='string'||data.password.length<1||data.password.length>1024)throw new RequestError('Invalid username or password.',401);let email=identity;
   if(!identity.includes('@')){const keyed=await db.Creator.filter({handle_key:identity});const profile=keyed[0]||(await db.Creator.filter({handle:identity}))[0];if(!profile||profile.status!=='active')throw new RequestError('Invalid username or password.',401);const account=await db.User.get(profile.user_id);if(!account||account.disabled||!account.email)throw new RequestError('Invalid username or password.',401);email=account.email}
   try{const response=await client.auth.loginViaEmailPassword(email,data.password,typeof data.turnstile_token==='string'?data.turnstile_token:undefined);return ok({access_token:response.access_token})}catch{throw new RequestError('Unable to sign in. Check your credentials and complete any initial account verification required by Base44.',401)}
  }
  if(action==='creator-verification'){auth();return ok({verified:await monetizationVerified(),enrollment_available:false,required_for:'activating paid offers and publishing paid content',ordinary_posting_requires_mfa:false})}
  if(action==='community-list'){const rows=await db.Community.filter({status:'active'},'-created_date',100);return ok({communities:rows.map(publicCommunity)})}
  if(action==='community-read'){const c=await community(text(data.id,100,true));return ok({community:publicCommunity(c),role:await communityRole(c)})}
  if(action==='community-save'){
   auth();const signature=await requireLicense();const existing=data.id?await community(text(data.id,100,true)):null;if(existing&&existing.user_id!==user.id&&!isElevated)throw new RequestError('Only the owner can edit this community.',403);const slug=text(data.slug,30,true);if(!/^[a-z0-9_]{3,30}$/.test(slug))throw new RequestError('Use 3–30 lowercase letters, numbers or underscores.');const duplicates=await db.Community.filter({slug});if(duplicates.some(c=>c.id!==existing?.id))throw new RequestError('Community name is already taken.',409);
   const fields={user_id:existing?.user_id||user.id,name:text(data.name,60,true),slug,description:text(data.description||'',2000),rules:text(data.rules,5000,true),status:'active',social_links:socialProfiles(data),license_signature_id:signature.id,license_version:signature.version};const c=existing?await db.Community.update(existing.id,fields):await db.Community.create(fields);await audit('community-save',c.id);return ok({community:publicCommunity(c)});
  }
  if(action==='community-join'){
   auth();const c=await community(text(data.id,100,true));const rows=await db.CommunityMember.filter({community_id:c.id,user_id:user.id});if(rows.some(m=>m.status==='banned'))throw new RequestError('You are banned from participating in this community.',403);if(data.accept_rules!==true)throw new RequestError('Read and accept the community rules first.');if(c.user_id!==user.id&&!rows.length){const own=(await db.Creator.filter({user_id:user.id}))[0];await db.CommunityMember.create({community_id:c.id,user_id:user.id,display_name:own?.display_name||'Community member',role:'member',status:'active'})}return ok({success:true});
  }
  if(action==='community-members'){
   const c=await community(text(data.id,100,true));await moderator(c);const rows=await db.CommunityMember.filter({community_id:c.id},'created_date',200);return ok({members:rows.map(m=>({id:m.id,display_name:m.display_name,role:m.role,status:m.status}))});
  }
  if(action==='community-member-update'){
   const c=await community(text(data.community_id,100,true));const role=await moderator(c);const m=await db.CommunityMember.get(text(data.member_id,100,true));if(!m||m.community_id!==c.id||m.user_id===c.user_id||m.user_id===user.id)throw new RequestError('Member unavailable.',404);const decision=choose(data.decision,['promote','demote','ban','unban'],'ban');if(['promote','demote'].includes(decision)&&!['owner','admin'].includes(role))throw new RequestError('Only the community owner can appoint moderators.',403);if(m.role==='moderator'&&role==='moderator')throw new RequestError('The owner must review actions against another moderator.',403);if(decision==='promote'&&m.status!=='active')throw new RequestError('Only active members can become moderators.',409);
   const fields=decision==='promote'?{role:'moderator'}:decision==='demote'?{role:'member'}:decision==='ban'?{status:'banned',role:'member'}:{status:'active',role:'member'};const rows=await db.CommunityMember.filter({community_id:c.id,user_id:m.user_id});for(const row of rows)await db.CommunityMember.update(row.id,fields);await audit('community-member-update',m.id,decision);return ok({success:true});
  }
  if(action==='community-modqueue'){
   const c=await community(text(data.id,100,true));await moderator(c);const reports=await db.Report.filter({community_id:c.id,status:'open'},'-created_date',100);return ok({reports:reports.filter(r=>r.destination!=='platform')});
  }
  if(action==='community-moderate'){
   const t=await db.ForumThread.get(text(data.thread_id,100,true));if(!t?.community_id)throw new RequestError('Discussion unavailable.',404);const c=await community(t.community_id);await moderator(c);const decision=choose(data.decision,['hide','lock','unlock','pin','unpin','dismiss'],'hide');let report:any=null;if(data.report_id){report=await db.Report.get(text(data.report_id,100,true));if(!report||report.community_id!==c.id||report.forum_thread_id!==t.id||report.destination==='platform')throw new RequestError('Report unavailable.',404)}
   if(decision==='hide'&&report?.forum_reply_id){const reply=await db.ForumReply.get(report.forum_reply_id);if(!reply||reply.thread_id!==t.id)throw new RequestError('Reply unavailable.',404);await db.ForumReply.update(reply.id,{status:'hidden'})}else if(decision!=='dismiss'){const fields=decision==='hide'?{status:'hidden'}:decision==='lock'||decision==='unlock'?{locked:decision==='lock'}:{pinned:decision==='pin'};await db.ForumThread.update(t.id,fields)}if(report)await db.Report.update(report.id,{status:decision==='dismiss'?'dismissed':'actioned'});await audit('community-moderate',t.id,decision);return ok({success:true});
  }
  if(action==='sighting-list'){
   const start=offset(data.offset);const query:any={status:'published',label:'Claimed Encounter',sighting_enabled:true};if(data.category)query.category=choose(data.category,categories,'Unidentified');
   const rows=await db.Post.filter(query,'-created_date',51,start);const blocked=await blocks();const sightings=[];
   for(const p of rows.slice(0,50)){if(blocked.has(p.user_id)||p.sighting_firsthand!==true||!Number.isFinite(p.sighting_latitude)||!Number.isFinite(p.sighting_longitude))continue;const c=await db.Creator.get(p.creator_id);if(!c||c.status!=='active')continue;sightings.push({id:p.id,post_id:p.id,creator_id:p.creator_id,title:p.title,teaser:p.teaser,category:p.category,subcategory:p.subcategory,visibility:p.visibility,latitude:p.sighting_latitude,longitude:p.sighting_longitude,precision:p.sighting_precision,encounter_date:p.encounter_date,place:p.sighting_place,verification:'self-reported-unverified'})}
   return ok({sightings,next_offset:rows.length>50?start+50:null});
  }
  if(action==='sighting-save'){
   auth();const p=await db.Post.get(text(data.post_id,100,true));if(!p||p.user_id!==user.id)throw new RequestError('You can only map your own encounter stories.',403);
   if(data.enabled===false){await db.Post.update(p.id,{sighting_enabled:false,sighting_latitude:0,sighting_longitude:0,sighting_place:'',encounter_date:'',sighting_firsthand:false,sighting_precision:''});await audit('sighting-remove',p.id);return ok({success:true})}
   const c=await db.Creator.get(p.creator_id);if(p.status!=='published'||p.label!=='Claimed Encounter'||!c||c.status!=='active')throw new RequestError('Publish a Claimed Encounter story before adding a pin.',409);
   if(data.firsthand!==true||data.public_location!==true)throw new RequestError('Confirm this is your firsthand encounter and agree to share its location publicly.');
   if(typeof data.latitude!=='number'||!Number.isFinite(data.latitude)||data.latitude < -85||data.latitude > 85||typeof data.longitude!=='number'||!Number.isFinite(data.longitude)||data.longitude < -180||data.longitude > 180)throw new RequestError('Choose valid map coordinates: latitude −85 to 85, longitude −180 to 180.');
   const precision=choose(data.precision,['approximate','exact'],'approximate');const day=text(data.encounter_date,10,true);if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||Number.isNaN(Date.parse(day))||new Date(day).toISOString().slice(0,10)!==day||day>new Date(Date.now()+14*60*60*1000).toISOString().slice(0,10))throw new RequestError('Enter a valid date when you witnessed the encounter, not a future date.');
   const round=(n:number)=>precision==='approximate'?Math.round(n*10)/10:Math.round(n*100000)/100000;
   await db.Post.update(p.id,{sighting_enabled:true,sighting_latitude:round(data.latitude),sighting_longitude:round(data.longitude),sighting_precision:precision,encounter_date:day,sighting_place:text(data.place,120,true),sighting_firsthand:true});await audit('sighting-save',p.id,precision);return ok({success:true});
  }
  if(action==='mention-resolve'||action==='tag-feed')return await handleSocialAction({action,data,db,headers,RequestError,isBlocked,teaser,publicCreator});
  if(action==='earnings-summary'){
   auth();const profiles=await db.Creator.filter({user_id:user.id});const owner=profiles.find((c:any)=>c.status==='active'&&c.platform_owned!==true);
   const unconfigured={earned_cents:0,pending_cents:0,available_cents:0,committed_cents:0,paid_cents:0,refunded_cents:0,untrusted_records:0,payouts_enabled:false};
   const merchantId=String(Deno.env.get('ONLYCRYPTIDS_PAYPAL_MERCHANT_ID')||'').trim();
   if(!owner||!merchantId)return ok({...unconfigured,creator_id:owner?.id||null,currency:'USD',provider:'paypal',provider_connected:false,recipient_connected:false,withdrawals_enabled:false,
     reason:owner?'PayPal marketplace and verified revenue reconciliation are not configured.':'Create an active creator profile to prepare for payouts.',history:[]});
   const [e,p,receiver]=await Promise.all([
     db.CreatorEarning.filter({user_id:user.id,creator_id:owner.id},'-created_date',1001),
     db.CreatorPayout.filter({user_id:user.id,creator_id:owner.id},'-created_date',1001),
     db.CreatorPayoutProfile.filter({user_id:user.id,creator_id:owner.id},'-created_date',5)]);
   if(e.length>1000||p.length>1000)return ok({...unconfigured,creator_id:owner.id,currency:'USD',provider:'paypal',provider_connected:false,recipient_connected:false,withdrawals_enabled:false,
     reason:'The payout history is too large to safely reconcile in this view. A paginated ledger review is required.',history:[]});
   const totals=reconcileEarnings({earnings:e,payouts:p,merchantId});
   const linked=receiver.some((r:any)=>r.provider==='paypal'&&r.status==='active'&&r.verified===true&&String(r.provider_account_id||'').length>=6);
   return ok({...totals,creator_id:owner.id,currency:'USD',provider:'paypal',provider_connected:true,recipient_connected:linked,withdrawals_enabled:false,
      reason:'Live payouts remain disabled until seller onboarding, verified subscription webhooks, an atomic ledger, and PayPal Payouts approval are complete.',
      history:p.slice(0,15).map((r:any)=>({status:r.status,amount_cents:r.amount_cents,requested_at:r.requested_at,completed_at:r.completed_at}))});
  }
  if(action==='payout-request'){auth();throw new RequestError('Withdrawal is not active. No money has been reserved or transferred. Complete PayPal marketplace approval and verified earnings reconciliation first.',503)}
  if(action==='generation-quote'){
   const mode=choose(data.mode,['story','photo-story','refine','art'],'story');
   return ok({...generationQuote(mode),spending_enabled:false,welcome_suffering:creditPolicy.welcomeUnits,message:'1 Suffering per successful generation is planned. No credit can be spent until the atomic wallet and AI provider are enabled.'});
  }
  if(action==='tip-quote'){
   auth();const kind=choose(data.target_kind,['post','creator'],'post');const amount=tipQuote(data.units);
   let c:any=null;
   if(kind==='post'){const p=await db.Post.get(text(data.target_id,100,true));if(!p||p.status!=='published'||await isBlocked(p.user_id))throw new RequestError('Post unavailable.',404);c=await db.Creator.get(p.creator_id)}
   else {c=await db.Creator.get(text(data.target_id,100,true))}
   if(!c||c.status!=='active'||c.user_id===user.id||await isBlocked(c.user_id))throw new RequestError('Tipping this account is unavailable.',403);
   return ok({...amount,target_kind:kind,target_id:data.target_id,recipient:c.display_name,tip_enabled:false,withdrawable:false,
      message:'Suffering tips are a proposed community feature. No credit is sent, debited or converted to cash.'});
  }
  if(action==='tip-send'){auth();throw new RequestError('Suffering tips are not active. No credit was debited or sent.',503)}
  if(action==='leaderboard-month'){
   const month=text(data.month||new Date().toISOString().slice(0,7),7,true);
   if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new RequestError('Invalid leaderboard month.');
   const [ps,cs,rs,ls,comments]=await Promise.all([
    db.Post.filter({status:'published'},'-created_date',301),
    db.Creator.filter({status:'active'},'-created_date',300),
    db.ContestRating.list('-created_date',1001),
    db.Interaction.filter({kind:'like'},'-created_date',1001),
    db.Comment.filter({status:'visible'},'-created_date',1001)]);
   const boards=buildMonthlyBoards({posts:ps,creators:cs,ratings:rs,interactions:ls,comments,month});
   return ok({...boards,data_limited:ps.length>300||rs.length>1000||ls.length>1000||comments.length>1000,
      tips_enabled:false,eligibility:'No paid Suffering contributes to the prize decision. A final winner has not been selected.'});
  }
  if(action==='leaderboard-rate'){
   auth();const p=await db.Post.get(text(data.post_id,100,true));
   if(!p||p.status!=='published'||p.visibility!=='free'||p.demo===true||await isBlocked(p.user_id))throw new RequestError('This post cannot be rated.',403);
   if(p.user_id===user.id)throw new RequestError('You cannot judge your own work.',403);
   const fields:any={user_id:user.id,post_id:p.id,rated_at:new Date().toISOString()};
   for(const field of scoreCategories){if(!starRange(data[field]))throw new RequestError('Rate every category from 1 to 5.');fields[field]=data[field]}
   const existing=await db.ContestRating.filter({user_id:user.id,post_id:p.id});
   const rec=existing.length?await db.ContestRating.update(existing[0].id,fields):await db.ContestRating.create(fields);
   await audit('leaderboard-rate',p.id,'five-category-rating');
   return ok({rated:true,id:rec.id});
  }
  if(action==='credit-catalog')return ok({policy:creditPolicy,packs:creditPacks,purchases_enabled:false,spending_enabled:false,welcome_suffering:creditPolicy.welcomeUnits,ai_generation_cost:creditPolicy.aiGenerationUnits,tips_enabled:false,disabled_reason:'PayPal connection, verified funding and atomic credit accounting are not active.'});
  if(action==='creator-plans'){
   const c=await db.Creator.get(text(data.creator_id,100,true));if(!c||c.status!=='active'||await isBlocked(c.user_id))throw new RequestError('Creator unavailable.',404);const rows=await db.CreatorPlan.filter({creator_id:c.id},'created_date',100);return ok({plans:rows.filter(p=>p.status==='active'||c.user_id===user?.id||(c.platform_owned&&isElevated)).map(publicPlan),checkout_enabled:false});
  }
  if(action==='plan-save'){
   const c=data.creator_id?await publishingProfile(data.creator_id):await creator();const existing=data.id?await db.CreatorPlan.get(text(data.id,100,true)):null;if(data.id&&(!existing||existing.creator_id!==c.id||!(existing.user_id===user.id||(c.platform_owned&&isElevated))))throw new RequestError('Plan unavailable.',404);
   if((data.status??'active')==='active'){if(!c.platform_owned)await requireLicense();await requireMonetization()}
   const fields={user_id:existing?.user_id||user.id,creator_id:c.id,beneficiary_type:c.platform_owned?'platform':'creator',beneficiary_name:c.platform_owned?'Interplanetary Association':c.display_name,revenue_purpose:c.platform_owned?'moderation_costs':'creator_earnings',name:text(data.name,60,true),description:text(data.description||'',1000),price_suffering:units(data.price_suffering),period_days:30,status:choose(data.status,['active','paused'],'active'),revision:(existing?.revision||0)+1};
   const p=existing?await db.CreatorPlan.update(existing.id,fields):await db.CreatorPlan.create(fields);await audit('creator-plan-save',p.id);return ok({plan:publicPlan(p)});
  }
  if(action==='purchase-quote'){
   auth();const kind=choose(data.kind,['credits','subscription','premium'],'credits');let cost:any;let target:any={};
   if(kind==='credits'){const pack=creditPacks.find(p=>p.id===data.pack_id);if(!pack)throw new RequestError('Pack unavailable.',404);cost=creditCost(pack.units);target={pack_id:pack.id}}
   else if(kind==='subscription'){const p=await db.CreatorPlan.get(text(data.plan_id,100,true));if(!p||p.status!=='active')throw new RequestError('Plan unavailable.',404);const c=await db.Creator.get(p.creator_id);if(!c||c.status!=='active'||await isBlocked(c.user_id)||c.user_id===user.id)throw new RequestError('Subscription unavailable.',403);cost=creditCost(units(p.price_suffering));target={plan_id:p.id,revision:p.revision,period_days:30,renews_automatically:false,beneficiary_type:c.platform_owned?'platform':'creator',beneficiary_name:c.platform_owned?'Interplanetary Association':c.display_name,revenue_purpose:c.platform_owned?'moderation_costs':'creator_earnings'}}
   else{const p=await db.Post.get(text(data.post_id,100,true));if(!p||p.status!=='published'||p.visibility!=='premium'||await isBlocked(p.user_id)||p.user_id===user.id)throw new RequestError('Premium post unavailable.',404);cost=creditCost(units(p.price_suffering));target={post_id:p.id,revision:p.revision}}
   return ok({kind,...target,...cost,credit_name:creditPolicy.name,checkout_enabled:false,disclosure:'Purchased Suffering pays for platform services only. It does not grant sweepstakes entries or improve odds. No payment or credit debit has occurred.'});
  }
  if(action==='purchase'){auth();throw new RequestError('Purchases are not active. No payment was taken and no Suffering was deducted.',503)}
  if(action==='license-status'){const c=await licenseContext();const records=user?await db.CreatorLicenseSignature.filter({user_id:user.id,agreement_hash:c.hash,version:c.version,status:'signed'}):[];return ok({text:c.text,hash:c.hash,version:c.version,ready:c.ready,signed:Boolean(records[0])})}
  if(action==='license-sign'){
   auth();const c=await licenseContext();if(!c.ready)throw new RequestError('The agreement is not ready for signature.',409);if(data.version!==c.version||data.agreement_hash!==c.hash)throw new RequestError('The agreement changed. Read the current version before signing.',409);
   for(const key of ['read','commercial','share','authority','electronic'])if(data[key]!=='yes')throw new RequestError('Every signature acknowledgment is required.');
   const existing=await db.CreatorLicenseSignature.filter({user_id:user.id,version:c.version,agreement_hash:c.hash,status:'signed'});if(existing[0])return ok({signed:true,id:existing[0].id});
   const legal_name=text(data.legal_name,150,true);if(legal_name.length<2)throw new RequestError('Enter your full legal name.');
   const record=await db.CreatorLicenseSignature.create({user_id:user.id,legal_name,represented_holder:text(data.represented_holder||'',200),version:c.version,agreement_hash:c.hash,agreement_text:c.text,signed_at:new Date().toISOString(),acknowledgments:['read','commercial','share','authority','electronic'],status:'signed',operator_name:c.settings.legal_owner,creator_share_basis_points:c.settings.creator_share_basis_points});await audit('creator-license-signed',record.id,c.hash);return ok({signed:true,id:record.id});
  }
  if(action==='license-copy'){auth();const records=await db.CreatorLicenseSignature.filter({user_id:user.id},'-created_date',100);return ok({agreements:records.map(r=>({id:r.id,legal_name:r.legal_name,represented_holder:r.represented_holder,operator_name:r.operator_name,version:r.version,agreement_hash:r.agreement_hash,agreement_text:r.agreement_text,signed_at:r.signed_at,acknowledgments:r.acknowledgments,status:r.status}))})}
  if(action==='bootstrap'){
   const cs=await db.Creator.filter({status:'active'},'-created_date',100);
   const ps=await db.Post.filter({status:'published'},'-created_date',100);
   const mine={follows:[],saved:[],likes:[],subscriptions:[],notifications:[]} as any;
   let ownPosts:any[]=[];
   if(user&&!user.disabled){const interactions=await db.Interaction.filter({user_id:user.id},'-created_date',1000);mine.follows=interactions.filter(i=>i.kind==='follow').map(i=>i.target_id);mine.saved=interactions.filter(i=>i.kind==='save').map(i=>i.target_id);mine.likes=interactions.filter(i=>i.kind==='like').map(i=>i.target_id);mine.subscriptions=await db.Subscription.filter({user_id:user.id},'-created_date',100);mine.notifications=await db.Notification.filter({user_id:user.id},'-created_date',50);ownPosts=await db.Post.filter({user_id:user.id},'-created_date',100);if(isElevated){for(const c of cs.filter(c=>c.platform_owned)){const rows=await db.Post.filter({creator_id:c.id},'-created_date',100);ownPosts.push(...rows)}}}
   const byId=new Map(ps.map(p=>[p.id,teaser(p)]));for(const p of ownPosts.filter(p=>p.status!=='deleted'))byId.set(p.id,{...teaser(p),body:p.body,...evidence(p),revision:p.revision,can_edit:p.user_id===user?.id});
   const blocked=await blocks();return ok({creators:cs.filter(c=>!blocked.has(c.user_id)).map(publicCreator),posts:[...byId.values()].filter((p:any)=>{const c=cs.find(c=>c.id===p.creator_id);return c&&!blocked.has(c.user_id)}).sort((a:any,b:any)=>Date.parse(b.created_date)-Date.parse(a.created_date)),user:user&&!user.disabled?{id:user.id,full_name:user.full_name,role:isOperator?'super_admin':user.role}:null,mine});
  }
  if(action==='profile-save'){
   auth();if(data.accepted!=='yes')throw new RequestError('Accept the Terms and Creator Agreement to continue.');
   const handle=text(data.handle,30,true);if(!/^[A-Za-z0-9_-]{3,30}$/.test(handle))throw new RequestError('Use 3–30 letters, numbers, underscores, or dashes.');
   if(handle.toLowerCase().includes('admin')&&!isOperator)throw new RequestError('Usernames containing admin are reserved.',403);
   const handle_key=handle.toLowerCase();
   const duplicate=[...(await db.Creator.filter({handle_key})),...(await db.Creator.filter({handle:handle_key})),...(await db.Creator.filter({handle}))];if(duplicate.some(c=>c.user_id!==user.id))throw new RequestError('That username is already in use.',409);
   const existing=await db.Creator.filter({user_id:user.id});if(existing[0]?.status==='suspended')throw new RequestError('This creator account is suspended.',403);
   const price=Number(data.price);if(!Number.isFinite(price)||price<1||price>100)throw new RequestError('Choose a monthly price from $1 to $100.');
   const display_name=text(data.display_name,60,true);const social_links=socialProfiles(data);const fields={user_id:user.id,display_name,handle,handle_key,bio:text(data.bio||'',1000),social_links,price:Math.round(price*100)/100,category:choose(data.category,categories,'Bigfoot'),status:'active',avatar:display_name.slice(0,2).toUpperCase(),color:'#a8c98e'};
   const c=existing[0]?await db.Creator.update(existing[0].id,fields):await db.Creator.create(fields);
   await db.PolicyAcceptance.create({user_id:user.id,version:'draft-2026-10-22',agreements:['Terms of Service','Creator Agreement'],accepted_at:new Date().toISOString()});await audit('profile-save',c.id);return ok({creator:publicCreator(c)});
  }
  if(action==='post-save'){
   auth();if(data.rights_confirmed!==true)throw new RequestError('Confirm your right to publish the content.');
   const c=await publishingProfile(data.creator_id);const signature=data.status==='draft'||(c.platform_owned&&isElevated)?null:await requireLicense();
   if(data.status!=='draft'&&['subscribers','premium'].includes(data.visibility))await requireMonetization();
   const current=data.id?await db.Post.get(text(data.id,100,true)):null;if(current&&!(current.user_id===user.id||(c.platform_owned&&isElevated&&current.creator_id===c.id)))throw new RequestError('You cannot edit that post.',403);
   const visibility=choose(data.visibility,['free','subscribers','premium'],'free');const fields={user_id:c.platform_owned?c.user_id:user.id,creator_id:c.id,title:text(data.title,160,true),teaser:text(data.teaser,500,true),body:text(data.body,30000,true),category:choose(data.category,categories,'Bigfoot'),subcategory:subcategory(choose(data.category,categories,'Bigfoot') as string,data.subcategory),format:choose(data.format,formats,'Story'),label:choose(data.label,labels,'Claimed Encounter'),visibility,price_suffering:visibility==='premium'?units(data.price_suffering):0,status:choose(data.status,['draft','published'],'draft'),rights_confirmed:true,revision:(current?.revision||0)+1};
   if(current&&['hidden','deleted'].includes(current.status))throw new RequestError('This post is under moderation.',403);
   const section=choose(data.section,['main','deep-dark-web'],'main');const deep_category=section==='deep-dark-web'?choose(data.deep_category,['shadow-forums','hidden-archives','lost-signals','cute-creeps','cipher-whispers'],'shadow-forums'):'';const rawTags=Array.isArray(data.hashtags)?data.hashtags:[];if(rawTags.length>12)throw new RequestError('Use at most 12 hashtags.');const hashtags=[...new Set([...rawTags.map(v=>text(v,40).replace(/^#/,'').toLowerCase()).filter(v=>/^[a-z0-9_]{1,40}$/.test(v)),...(section==='deep-dark-web'?['deepdarkweb']:[])])].slice(0,12);
   const postHashtags=[...new Set([...(Array.isArray(data.hashtags)?data.hashtags:[]).map((t:unknown)=>String(t).replace(/^#/,'').toLowerCase()).filter((t:string)=>/^[a-z][a-z0-9_]{0,39}$/.test(t)),...extractHashtags([fields.title,fields.teaser,fields.body].join(' '))])].slice(0,12);
   const licensedFields={...fields,hashtags:postHashtags,section,deep_category,hashtags,observation_context:text(data.observation_context||'',2000),evidence_notes:text(data.evidence_notes||'',2000),alternative_explanations:text(data.alternative_explanations||'',1500),source_url:sourceUrl(data.source_url),...(fields.label!=='Claimed Encounter'||fields.status!=='published'?{sighting_enabled:false,sighting_latitude:0,sighting_longitude:0,sighting_place:'',encounter_date:'',sighting_firsthand:false,sighting_precision:''}:{}),...(signature?{license_signature_id:signature.id,license_version:signature.version}:{})};
   const p=current?await db.Post.update(current.id,licensedFields):await db.Post.create({...licensedFields,media_ids:[]});await audit('post-save',p.id,`revision ${p.revision}`);return ok({post:teaser(p)});
  }
  if(action==='post-delete'){
   auth();const p=await db.Post.get(text(data.id,100,true));const c=p?await db.Creator.get(p.creator_id):null;if(!p||!(p.user_id===user.id||(c?.platform_owned&&isElevated)))throw new RequestError('Post unavailable.',404);await db.Post.update(p.id,{status:'deleted'});await audit('post-delete',p.id);return ok({success:true});
  }
  if(action==='post'){
   const p=await db.Post.get(text(data.id,100,true));if(!await canRead(p))throw new RequestError('An active subscription is required, or this post is unavailable.',403);
   const comments=await db.Comment.filter({post_id:p.id,status:'visible'},'created_date',100);const blocked=await blocks();return ok({post:{...teaser(p),body:p.body,...evidence(p),media:[]},comments:comments.filter(c=>!blocked.has(c.user_id)).map(c=>({id:c.id,body:c.body,display_name:c.display_name,created_date:c.created_date,can_remove:Boolean(user&&(c.user_id===user.id||p.user_id===user.id||isElevated))}))});
  }
  if(action==='toggle'){
   auth();const kind=choose(data.kind,['follow','save','like'],'save');const target_id=text(data.target_id,100,true);
   if(kind==='follow'){const c=await db.Creator.get(target_id);if(!c||c.status!=='active'||await isBlocked(c.user_id))throw new RequestError('Creator unavailable.',404)}else{const p=await db.Post.get(target_id);if(!p||p.status!=='published'||await isBlocked(p.user_id))throw new RequestError('Post unavailable.',404)}
   const query={user_id:user.id,kind,target_id};const rows=await db.Interaction.filter(query);if(rows.length){for(const r of rows)await db.Interaction.delete(r.id);return ok({active:false})}await db.Interaction.create(query);return ok({active:true});
  }
  if(action==='comment'){
   auth();const signature=await requireLicense();const p=await db.Post.get(text(data.post_id,100,true));if(!await canRead(p))throw new RequestError('You cannot comment on this post.',403);let parent:any=null;if(data.parent_comment_id){parent=await db.Comment.get(text(data.parent_comment_id,100,true));if(!parent||parent.post_id!==p.id||parent.status!=='visible'||await isBlocked(parent.user_id))throw new RequestError('Reply target unavailable.',404)}const own=await db.Creator.filter({user_id:user.id});await db.Comment.create({user_id:user.id,post_id:p.id,...(parent?{parent_comment_id:parent.id}:{}),body:text(data.body,2000,true),display_name:own[0]?.display_name||'Community member',status:'visible',license_signature_id:signature.id,license_version:signature.version});return ok({success:true});
  }
  if(action==='comments'){
   const p=await db.Post.get(text(data.post_id,100,true));if(!await canRead(p))throw new RequestError('Post unavailable.',403);const start=offset(data.offset);const rows=await db.Comment.filter({post_id:p.id,status:'visible'},'created_date',51,start);const blocked=await blocks();return ok({comments:rows.slice(0,50).filter(c=>!blocked.has(c.user_id)).map(c=>({id:c.id,body:c.body,parent_comment_id:c.parent_comment_id,display_name:c.display_name,created_date:c.created_date,can_remove:Boolean(user&&(c.user_id===user.id||p.user_id===user.id||isElevated))})),next_offset:rows.length>50?start+50:null});
  }
  if(action==='comment-report'){
   auth();const c=await db.Comment.get(text(data.id,100,true));if(!c||c.status!=='visible'||await isBlocked(c.user_id))throw new RequestError('Comment unavailable.',404);const p=await db.Post.get(c.post_id);if(!await canRead(p))throw new RequestError('Comment unavailable.',403);await db.Report.create({user_id:user.id,post_id:p.id,comment_id:c.id,destination:'platform',reason:text(data.reason,3000,true),content_snapshot:c.body,status:'open'});return ok({success:true});
  }
  if(action==='comment-remove'){
   auth();const c=await db.Comment.get(text(data.id,100,true));if(!c||c.status!=='visible')throw new RequestError('Comment unavailable.',404);
   const p=await db.Post.get(c.post_id);if(c.user_id!==user.id&&p?.user_id!==user.id&&!isElevated)throw new RequestError('You cannot remove this comment.',403);
   await db.Comment.update(c.id,{status:'removed'});await audit('comment-remove',c.id);return ok({success:true});
  }
  if(action==='block-list'){auth();const rows=await db.UserBlock.filter({user_id:user.id},'-created_date',1000);return ok({blocks:rows.map(b=>({id:b.id,display_name:b.display_name}))})}
  if(action==='block'){
   auth();const c=await db.Creator.get(text(data.creator_id,100,true));if(!c||c.status!=='active')throw new RequestError('Creator unavailable.',404);if(c.user_id===user.id)throw new RequestError('You cannot block your own account.');
   const rows=await db.UserBlock.filter({user_id:user.id,target_user_id:c.user_id});if(!rows.length){const b=await db.UserBlock.create({user_id:user.id,target_user_id:c.user_id,display_name:c.display_name});await audit('user-block',b.id)}return ok({success:true});
  }
  if(action==='unblock'){
   auth();const b=await db.UserBlock.get(text(data.id,100,true));if(!b||b.user_id!==user.id)throw new RequestError('Block unavailable.',404);const rows=await db.UserBlock.filter({user_id:user.id,target_user_id:b.target_user_id});for(const row of rows)await db.UserBlock.delete(row.id);await audit('user-unblock',b.id);return ok({success:true});
  }
  if(action==='notification-read'){
   auth();const n=await db.Notification.get(text(data.id,100,true));if(!n||n.user_id!==user.id)throw new RequestError('Notification unavailable.',404);await db.Notification.update(n.id,{read:true});return ok({success:true});
  }
  if(action==='forum-list'){
   const start=offset(data.offset);const query:any={status:'published'};if(data.category)query.category=choose(data.category,categories,'Bigfoot');if(data.subcategory){if(!data.category||!validSubcategory(data.category,data.subcategory))throw new RequestError('Choose a valid cryptid category and subcategory.');query.subcategory=data.subcategory}if(data.community_id){const c=await community(text(data.community_id,100,true));query.community_id=c.id}
   const rows=await db.ForumThread.filter(query,'-created_date',21,start);const blocked=await blocks();return ok({threads:rows.slice(0,20).filter(t=>!blocked.has(t.user_id)).map(publicThread),next_offset:rows.length>20?start+20:null});
  }
  if(action==='forum-thread'){
   const t=await forumThread(text(data.id,100,true));const start=offset(data.offset);const rows=await db.ForumReply.filter({thread_id:t.id,status:'visible'},'created_date',51,start);const blocked=await blocks();const votes=await db.Interaction.filter({kind:'forum-vote',target_id:t.id},'-created_date',10000);const uniqueVotes=new Map();for(const v of votes)if(!uniqueVotes.has(v.user_id))uniqueVotes.set(v.user_id,v.value===-1?-1:1);const role=t.community_id?await communityRole(await community(t.community_id)):'visitor';const canModerate=['owner','moderator','admin'].includes(role);
   return ok({thread:{...publicThread(t),can_remove:publicThread(t).can_remove||canModerate},can_moderate:canModerate,vote_count:[...uniqueVotes.values()].reduce((a,b)=>a+b,0),vote_value:user?uniqueVotes.get(user.id)||0:0,voted:Boolean(user&&uniqueVotes.get(user.id)===1),replies:rows.slice(0,50).filter(r=>!blocked.has(r.user_id)).map(r=>({id:r.id,body:r.body,parent_reply_id:r.parent_reply_id,display_name:r.display_name,created_date:r.created_date,can_remove:Boolean(user&&(r.user_id===user.id||(!t.community_id&&t.user_id===user.id)||isElevated||canModerate))})),next_offset:rows.length>50?start+50:null});
  }
  if(action==='forum-create'){
   auth();const signature=await requireLicense();const c=(await db.Creator.filter({user_id:user.id}))[0];if(c&&c.status!=='active')throw new RequestError('This creator account is suspended.',403);
   const group=data.community_id?await community(text(data.community_id,100,true)):null;if(group)await member(group);const t=await db.ForumThread.create({user_id:user.id,...(group?{community_id:group.id}:{}),title:text(data.title,160,true),body:text(data.body,12000,true),category:choose(data.category,categories,'Unidentified'),subcategory:subcategory(choose(data.category,categories,'Unidentified') as string,data.subcategory),label:choose(data.label,labels,'Research/Commentary'),display_name:c?.display_name||'Community member',status:'published',locked:false,pinned:false,license_signature_id:signature.id,license_version:signature.version});await audit('forum-create',t.id);return ok({id:t.id});
  }
  if(action==='forum-reply'){
   auth();const t=await forumThread(text(data.thread_id,100,true));if(t.locked)throw new RequestError('This discussion is locked.',403);if(t.community_id)await member(await community(t.community_id));const signature=await requireLicense();const c=(await db.Creator.filter({user_id:user.id}))[0];if(c&&c.status!=='active')throw new RequestError('This creator account is suspended.',403);let parent:any=null;if(data.parent_reply_id){parent=await db.ForumReply.get(text(data.parent_reply_id,100,true));if(!parent||parent.thread_id!==t.id||parent.status!=='visible'||await isBlocked(parent.user_id))throw new RequestError('Reply target unavailable.',404)}
   const r=await db.ForumReply.create({user_id:user.id,thread_id:t.id,...(parent?{parent_reply_id:parent.id}:{}),body:text(data.body,4000,true),display_name:c?.display_name||'Community member',status:'visible',license_signature_id:signature.id,license_version:signature.version});await audit('forum-reply',r.id);return ok({success:true});
  }
  if(action==='forum-vote'){
   auth();const t=await forumThread(text(data.id,100,true));if(t.community_id)await member(await community(t.community_id));if(t.user_id===user.id)throw new RequestError('You cannot vote on your own discussion.');const value=data.value??1;if(![1,-1].includes(value))throw new RequestError('Invalid vote.');const query={user_id:user.id,kind:'forum-vote',target_id:t.id};const rows=await db.Interaction.filter(query);const same=rows.some(r=>(r.value===-1?-1:1)===value);for(const r of rows)await db.Interaction.delete(r.id);if(same)return ok({active:false,value:0});await db.Interaction.create({...query,value});return ok({active:true,value});
  }
  if(action==='forum-report'){
   auth();const t=await forumThread(text(data.thread_id,100,true));let r:any=null;if(data.reply_id){r=await db.ForumReply.get(text(data.reply_id,100,true));if(!r||r.thread_id!==t.id||r.status!=='visible'||await isBlocked(r.user_id))throw new RequestError('Reply unavailable.',404)}
   await db.Report.create({user_id:user.id,forum_thread_id:t.id,...(t.community_id?{community_id:t.community_id}:{}),...(r?{forum_reply_id:r.id}:{}),destination:choose(data.destination,['community','platform'],t.community_id?'community':'platform'),reason:text(data.reason,3000,true),content_snapshot:r?r.body:`${t.title}\n${t.body}`,status:'open'});return ok({success:true});
  }
  if(action==='forum-remove'){
   auth();const kind=choose(data.kind,['thread','reply'],'thread');const id=text(data.id,100,true);const row=kind==='thread'?await db.ForumThread.get(id):await db.ForumReply.get(id);if(!row)throw new RequestError('Discussion unavailable.',404);const t=kind==='thread'?row:await db.ForumThread.get(row.thread_id);const role=t?.community_id?await communityRole(await community(t.community_id)):'visitor';if(row.user_id!==user.id&&!(t&&!t.community_id&&t.user_id===user.id)&&!['owner','moderator','admin'].includes(role)&&!isElevated)throw new RequestError('You cannot remove this content.',403);
   if(kind==='thread')await db.ForumThread.update(id,{status:'removed'});else await db.ForumReply.update(id,{status:'removed'});await audit('forum-remove',id,kind);return ok({success:true});
  }
  if(action==='report'){
   auth();const p=await db.Post.get(text(data.post_id,100,true));if(!p||p.status!=='published')throw new RequestError('Post unavailable.',404);await db.Report.create({user_id:user.id,post_id:p.id,destination:'platform',reason:text(data.reason,3000,true),status:'open'});return ok({success:true});
  }
  if(action==='complaint'){
   auth();if(data.good_faith!=='yes'||data.accurate!=='yes')throw new RequestError('Both declarations are required.');const c=await db.CopyrightComplaint.create({user_id:user.id,work:text(data.work,5000,true),urls:text(data.urls,5000,true),contact:text(data.contact,5000,true),signature:text(data.signature,5000,true),good_faith:true,accurate:true,status:'received'});await audit('copyright-complaint',c.id);return ok({success:true});
  }
  if(action==='admin'){admin();return ok({reports:await db.Report.list('-created_date',100),complaints:await db.CopyrightComplaint.list('-created_date',100)})}
  if(action==='moderate'){
   admin();const r=await db.Report.get(text(data.id,100,true));if(!r)throw new RequestError('Report not found.',404);const decision=choose(data.decision,['hide','dismiss'],'dismiss');if(decision==='hide'){if(r.comment_id)await db.Comment.update(r.comment_id,{status:'hidden'});else if(r.forum_reply_id)await db.ForumReply.update(r.forum_reply_id,{status:'hidden'});else if(r.forum_thread_id)await db.ForumThread.update(r.forum_thread_id,{status:'hidden'});else if(r.post_id)await db.Post.update(r.post_id,{status:'hidden'});else throw new RequestError('Report has no valid content target.',409)}await db.Report.update(r.id,{status:decision==='hide'?'actioned':'dismissed'});await audit('moderate',r.id,decision);return ok({success:true});
  }
  // No client operation creates paid entitlements or signs arbitrary private URIs.
  throw new RequestError('Action not supported.',404);
 }catch(error){if(error instanceof RequestError)return Response.json({error:error.message},{status:error.status,headers});if(error instanceof SyntaxError)return Response.json({error:'Invalid request.'},{status:400,headers});console.error('Only Cryptids request failed',error instanceof Error?error.name:'Error');return Response.json({error:'The request could not be completed. Please try again.'},{status:500,headers})}
});
