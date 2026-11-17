// Shared browser/server copyedit: deliberately conservative, no content invention.
export const SKY_COPYEDIT_VERSION='sky-witness-copyedit-1';
const replacements=[
 [/\bteh\b/gi,'the'],[/\brecieve\b/gi,'receive'],[/\brecieved\b/gi,'received'],
 [/\bdefinately\b/gi,'definitely'],[/\bwierd\b/gi,'weird'],
 [/\bsatelites\b/gi,'satellites'],[/\bsatelite\b/gi,'satellite'],
 [/\bsatel8tes\b/gi,'satellites'],[/\boccured\b/gi,'occurred'],
 [/\bseperate\b/gi,'separate'],[/\bthier\b/gi,'their'],
 [/\bwhitness\b/gi,'witness'],[/\buntill\b/gi,'until'],
 [/\bcouldnt\b/gi,"couldn't"],[/\bdidnt\b/gi,"didn't"],[/\bwasnt\b/gi,"wasn't"],
 [/\bi\b/g,'I']
];
export function proofreadText(value){
 const original=String(value??'').slice(0,30000);
 let result=original.replace(/\r\n?/g,'\n').replace(/[\t ]+/g,' ').replace(/ *([,.!?;:]) +/g,'$1 ').replace(/ {2,}/g,' ').replace(/\n{3,}/g,'\n\n').trim();
 const changes=[];
 for(const [pattern,replacement] of replacements){
  const matches=result.match(pattern);
  if(matches){result=result.replace(pattern,()=>replacement);changes.push(matches.length+' × '+matches[0]+' → '+replacement)}
 }
 result=result.replace(/([.!?])([A-Za-z])/g,'$1 $2');
 result=result.replace(/(^|[.!?]\s+|\n+)([a-z])/g,(_m,prefix,letter)=>prefix+letter.toUpperCase());
 if(result!==original&&!changes.length)changes.push('Normalized whitespace, punctuation, or sentence capitalization');
 return {text:result,changes,version:SKY_COPYEDIT_VERSION,changed:result!==original};
}
export const witnessFields=[
 ['activity','What you were doing'],
 ['appearance','What it looked like (shape, size, lights, markings, sounds, materials)'],
 ['object_behavior','What the object or system was doing'],
 ['altitude','Estimated height and how you estimated it'],
 ['other_witnesses','Other witnesses and what they noticed'],
 ['later_sightings','Whether it appeared again'],
 ['impact','What happened afterward']
];
export function buildWitnessAccount(data){
 const section=(heading,value)=>value?heading+'\n'+String(value).trim()+'\n':'';
 return [
  section('THE FIRSTHAND ACCOUNT',data.original_account),
  section('WHEN & WHERE', [data.event_date,data.time_of_day,data.location_region].filter(Boolean).join(' · ')),
  section('CONDITIONS',data.weather),
  ...witnessFields.map(([k,label])=>section(label.toUpperCase(),data[k])),
  section('NOTES / POSSIBLE EXPLANATIONS / EVIDENCE',data.source_notes)
 ].filter(Boolean).join('\n').trim();
}
export const fictionalCoda='FICTIONAL ATMOSPHERIC CODA — NOT PART OF THE WITNESS ACCOUNT\nIn the version told after midnight, the worst part is not what was in the sky. It is the possibility that something up there noticed who was watching.';
