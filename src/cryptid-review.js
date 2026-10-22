// Versioned, deterministic editorial training baseline; no AI provider call or credit usage.
export const REVIEW_VERSION='cryptid-tracks-v1';
export const TRACK='🐾';
export function gradeCryptidPost(p){
 const title=String(p.title||'').trim(),teaser=String(p.teaser||'').trim(),body=String(p.body||'').trim();
 const words=body.split(/\s+/).filter(Boolean).length;
 const urls=[...new Set((body+' '+teaser).match(/https?:\/\/[^\s<>\])]+/g)||[])];
 const notes=[];let quality=1;
 if(title.length>=12)quality++;else notes.push('Make the title more descriptive.');
 if(teaser.length>=45)quality++;else notes.push('Add a useful summary.');
 if(words>=180)quality++;else notes.push('Provide more relevant detail.');
 if(words>=350 && /[.!?]\s|\n/.test(body))quality++;else notes.push('Improve structure and completeness.');
 const factual=['Claimed Encounter','Research/Commentary'].includes(p.label);
 let evidence=null;
 if(factual){
   evidence=1;
   if(/\b(19|20)\d{2}\b/.test(body) && /\b(at|near|in|county|state|lake|forest|road|river)\b/i.test(body))evidence++;
   if(urls.length)evidence++;
   notes.push('Provisional source-context score only. Claims, links, media origins, witnesses and forensics require independent verification.');
 }else notes.push('Creative work receives a quality score, not a claim of a genuine sighting.');
 return {quality_tracks:quality,evidence_tracks:evidence,review_version:REVIEW_VERSION,
  review_state:'automated-preliminary',review_notes:notes.join(' '),source_count:urls.length};
}
export function trackLabel(value){return Number.isInteger(value)&&value>=1&&value<=5?'🐾'.repeat(value)+' '+value+'/5':'N/A';}
