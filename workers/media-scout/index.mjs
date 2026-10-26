/*
 * OnlyCryptids Media Scout - Cloudflare scheduled Worker.
 * Searches Wikimedia Commons for reusable photos/videos; publishes only
 * source-linked, appropriately licensed media records, not copied articles.
 * No paid models, account credentials, or unattended scraping.
 */
const TOPICS = [
  ['bigfoot','Bigfoot','Bigfoot'],['mothman','Mothman','Mothman'],['yeti','Yeti','Bigfoot'],
  ['loch_ness','Loch Ness monster','Lake monsters'],['chupacabra','Chupacabra','Chupacabra'],
  ['jersey_devil','Jersey Devil','Jersey Devil'],['sea_serpent','sea serpent','Sea creatures'],
  ['thunderbird','Thunderbird cryptid','Unidentified'],['bunyip','Bunyip','Unidentified'],
  ['aliens','alien encounter','Aliens'],['ufo','UFO sighting','Aliens'],
  ['cryptid','cryptozoology','Unidentified'],['ogopogo','Ogopogo','Lake monsters'],
  ['mokele_mbembe','Mokele-mbembe','Lake monsters'],
  ['skinwalkers','public skinwalker folklore','Skinwalkers'],
  ['ghosts','ghost folklore','Ghosts'],
  ['alien_technologies','UFO technology','Alien technologies'],
  ['sacred_space_sightings','sacred site sightings','Sacred space sightings'],
  ['dreamscape','dreamscape folklore','Dreamscape']
];
const LIMIT = 2;
const BATCH = 12;

function stripMarkup(value, max = 220) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Math.min(Number(n), 0x10ffff)))
    .replace(/&(?:amp|quot|lt|gt|nbsp|apos);/g, m =>
      ({'&amp;':'&','&quot;':'"','&lt;':'<','&gt;':'>','&nbsp;':' ','&apos;':"'"})[m] || m)
    .replace(/\s+/g, ' ').trim().slice(0, max);
}
function licenseOf(metadata) {
  const name = stripMarkup(metadata.LicenseShortName?.value, 90);
  const link = String(metadata.LicenseUrl?.value || '');
  const allowed = /^(CC0(?:\s|$)|CC BY(?:-SA)?(?:\s|$)|Public domain(?:\s|$)|PD(?:\s|$))/i.test(name);
  if (!allowed || /(?:-NC|-ND)/i.test(name)) return null;
  return {name, url: link.startsWith('https://') ? link : ''};
}
function normalUrl(value, hostname) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password &&
      (u.hostname === hostname || (hostname === 'upload.wikimedia.org' && u.hostname === 'commons.wikimedia.org')) ? u.href : null;
  } catch { return null; }
}
function curated(page, topic) {
  const info = page.imageinfo?.[0];
  if (!info || !['image/jpeg','image/png','image/webp','image/gif','video/webm','video/ogg'].includes(info.mime)) return null;
  const m = info.extmetadata || {};
  const license = licenseOf(m);
  if (!license || m.NonFree?.value === 'True') return null;
  const author = stripMarkup(m.Attribution?.value || m.Artist?.value, 180);
  if (!author) return null;
  const source = normalUrl(info.descriptionurl, 'commons.wikimedia.org');
  const media = normalUrl(info.url, 'upload.wikimedia.org');
  if (!source || !media || !Number.isInteger(page.pageid)) return null;
  const filename = stripMarkup(String(page.title || '').replace(/^File:/i, '').replace(/\.[^.]+$/, '').replace(/_/g, ' '), 130);
  if (filename.length < 5) return null;
  const kind = info.mime.startsWith('video/') ? 'video' : 'image';
  const tag = topic[0];
  const category = topic[2];
  return {
    id: 'commons-' + page.pageid, source, media, kind,
    topic: tag, category, tags: [...new Set(['content','cryptids',tag,category.toLowerCase().replace(/\s+/g,'_')])],
    title: filename,
    caption: 'A ' + (kind === 'video' ? 'video' : 'picture') + ' catalogued on Wikimedia Commons in connection with ' +
      topic[1] + '. This source listing is not proof of a cryptid encounter.',
    alt: 'Commons ' + kind + ': ' + filename,
    author, license_name: license.name, license_url: license.url
  };
}
// Openverse is an independent openly-licensed image index. Use its public API
// when Commons refuses automated API access; never bypass the 403.
function curatedOpenverse(item, topic) {
  if (!item || item.mature || typeof item.id!=='string' || !/^[a-f0-9-]{36}$/i.test(item.id)) return null;
  const licenses = {'by':'CC BY', 'by-sa':'CC BY-SA', cc0:'CC0', pdm:'Public domain'};
  const licenseName = licenses[String(item.license||'').toLowerCase()];
  if (!licenseName) return null;
  const source = safeHttps(item.foreign_landing_url);
  const media = safeHttps(item.url);
  if (!source || !media) return null;
  const author = stripMarkup(item.creator,180);
  if (!author) return null;
  const licenseUrl = safeHttps(item.license_url);
  if (!licenseUrl && !['cc0','pdm'].includes(item.license)) return null;
  const title = stripMarkup(item.title||topic[1],130);
  if (title.length<5) return null;
  const tag = topic[0], category = topic[2];
  return {
    id:'openverse-'+item.id, source, media, kind:'image',
    topic:tag, category, tags:[...new Set(['content','cryptids',tag,category.toLowerCase().replace(/\\s+/g,'_')])],
    title, caption:'A licensed image indexed by Openverse on the subject of '+topic[1]+
      '. This is a credited reference, not confirmation of an encounter.',
    alt:'Licensed source image: '+title, author, license_name:licenseName, license_url:licenseUrl||source
  };
}
function safeHttps(value) {
  try {
    const u=new URL(value);
    return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;
  } catch { return null; }
}
async function searchOpenverse(topic,offset) {
  const u=new URL('https://api.openverse.org/v1/images/');
  u.searchParams.set('q',topic[1]);
  u.searchParams.set('page_size','12');
  u.searchParams.set('page',String(Math.floor(offset/BATCH)+1));
  u.searchParams.set('license','by,by-sa,cc0,pdm');
  const r=await fetch(u,{headers:{accept:'application/json'},signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw new Error('Openverse returned HTTP '+r.status);
  const body=await r.json();
  return {pages:(body.results||[]).map(x=>curatedOpenverse(x,topic)).filter(Boolean),
          hasMore:(body.page||0)<(body.page_count||0)};
}

function response(obj, status = 200) {
  return new Response(JSON.stringify(obj), {status, headers:{
    'content-type':'application/json; charset=utf-8',
    'access-control-allow-origin':'*',
    'cache-control':'public, max-age=120',
    'x-content-type-options':'nosniff'
  }});
}
async function collect(env) {
  if (!env.MEDIA_DB) throw new Error('MEDIA_DB binding missing');
  const control = await env.MEDIA_DB.prepare('SELECT enabled, term_index, search_offset FROM scout_control WHERE id=1').first();
  if (!control || control.enabled !== 1) return {status:'stopped'};
  const topic = TOPICS[control.term_index % TOPICS.length];
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  for (const [k,v] of Object.entries({
    action:'query',format:'json',generator:'search',
    gsrsearch:topic[1],gsrnamespace:'6',gsrlimit:String(BATCH),
    gsroffset:String(control.search_offset),prop:'imageinfo',
    iiprop:'url|mime|extmetadata',iiextmetadatalanguage:'en'
  })) url.searchParams.set(k,v);
  let results, hasMore;
  const remote = await fetch(url, {headers:{
    'accept':'application/json',
    'api-user-agent':'OnlyCryptidsMediaScout/1.0 (https://github.com/interplanetarysister/OnlyCryptids)'
  }, signal: AbortSignal.timeout(15000)});
  if (remote.status===403) {
    // Respect the Commons refusal. Openverse provides separate licensed data.
    const other=await searchOpenverse(topic,control.search_offset);
    results=other.pages;
    hasMore=other.hasMore;
  } else {
    if (!remote.ok) throw new Error('Commons returned HTTP ' + remote.status);
    const payload = await remote.json();
    if (payload.error) throw new Error('Commons API: ' + stripMarkup(payload.error.info, 120));
    results=Object.values(payload.query?.pages || {}).map(page=>curated(page,topic)).filter(Boolean);
    hasMore=Boolean(payload.continue?.gsroffset);
  }
  let added = 0;
  for (const page of results) {
    if (added >= LIMIT) break;
    const p = page;
    if (!p) continue;
    const result = await env.MEDIA_DB.prepare(
      "INSERT OR IGNORE INTO sourced_media (id, source_url, media_url, kind, topic, category, tags_json, title, caption, alt_text, author_credit, license_name, license_url, published_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))"
    ).bind(p.id,p.source,p.media,p.kind,p.topic,p.category,JSON.stringify(p.tags),p.title,p.caption,p.alt,p.author,p.license_name,p.license_url).run();
    if (result.meta?.changes) added += 1;
  }
  const nextOffset = control.search_offset + BATCH;
  const exhausted = !hasMore || nextOffset > 240;
  await env.MEDIA_DB.prepare(
    "UPDATE scout_control SET term_index=?, search_offset=?, last_run=datetime('now'), last_added=?, last_error=NULL WHERE id=1"
  ).bind(exhausted ? control.term_index + 1 : control.term_index,
    exhausted ? 0 : nextOffset, added).run();
  return {status:'running',topic:topic[0],added};
}
export default {
  async scheduled(_event,env,ctx) { ctx.waitUntil(collect(env).catch(async error => {
    console.error('OnlyCryptids media scout failed',String(error));
    await env.MEDIA_DB.prepare("UPDATE scout_control SET last_run=datetime('now'), last_added=0, last_error=? WHERE id=1")
      .bind(String(error?.message||error).slice(0,180)).run();
  })); },
  async fetch(request,env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return response({});
    if (request.method !== 'GET') return response({error:'Method not allowed'},405);
    if (url.pathname === '/api/status') {
      const row = await env.MEDIA_DB.prepare('SELECT enabled,last_run,last_added,last_error FROM scout_control WHERE id=1').first();
      return response({enabled:row?.enabled===1,last_run:row?.last_run||null,last_added:row?.last_added||0,error:row?.last_error||null});
    }
    if (url.pathname === '/api/posts') {
      const limit = Math.min(30,Math.max(1,Number.parseInt(url.searchParams.get('limit')||'12',10)||12));
      const tag = String(url.searchParams.get('tag')||'').toLowerCase();
      if (tag && !/^[a-z][a-z0-9_]{0,39}$/.test(tag)) return response({error:'Invalid tag'},400);
      const category = String(url.searchParams.get('category')||'');
      if (category && !TOPICS.some(x=>x[2]===category)) return response({error:'Invalid category'},400);
      const clauses = [];
      const binds = [];
      if (tag && !['content','cryptids'].includes(tag)) {
        clauses.push('topic=?');
        binds.push(tag);
      }
      if (category) { clauses.push('category=?'); binds.push(category); }
      const sql = 'SELECT id,source_url,media_url,kind,topic,category,tags_json,title,caption,alt_text,author_credit,license_name,license_url,published_at FROM sourced_media'
        + (clauses.length ? ' WHERE '+clauses.join(' AND ') : '') + ' ORDER BY published_at DESC,id DESC LIMIT ?';
      const rows = await env.MEDIA_DB.prepare(sql).bind(...binds,limit).all();
      return response({posts:(rows.results||[]).map(x=>({...x,genre:'Reference media',hashtags:JSON.parse(x.tags_json||'[]'),tags_json:undefined})),source:'Wikimedia Commons licensed media'});
    }
    return response({error:'Not found'},404);
  }
};
