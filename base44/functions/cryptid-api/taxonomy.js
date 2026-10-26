// Canonical OnlyCryptids topical taxonomy, shared by API and browser.
export const cryptidTaxonomy=Object.freeze({
 'Bigfoot':['Sasquatch / Pacific Northwest','Skunk ape / Southeast','Yowie / Australia','Yeti / Himalayas','Other hairy hominids'],
 'Mothman':['Point Pleasant accounts','Other regional accounts','Original winged interpretations'],
 'Lake monsters':['Loch Ness monster','Champ / Lake Champlain','Other lake cryptids','Original lake creatures'],
 'Chupacabra':['Reptilian interpretations','Canine interpretations','Other interpretations'],
 'Jersey Devil':['Pine Barrens accounts','Classic winged depictions','Original interpretations'],
 'Sea creatures':['Sea serpents','Kraken / giant cephalopods','Other ocean cryptids','Original sea creatures'],
 'Skinwalkers':['Publicly shared accounts','Folklore and cultural context','Fictional interpretations'],
 'Aliens':['Reported encounters','Unidentified aerial phenomena','Extraterrestrial speculation','Fictional extraterrestrials'],
 'Ghosts':['Apparitions','Allegedly haunted locations','Historic ghost accounts','Fictional hauntings'],
 'Alien technologies':['Alleged craft and propulsion','Reported artifacts','Signals and transmissions','Speculative technologies'],
 'Sacred space sightings':['Public sightings near sacred sites','Folklore and site history','Unverified reports','Fictional sacred spaces'],
 'Dreamscape':['Dream encounters','Lucid dreaming','Nightmares and sleep paralysis','Fictional dream worlds'],
 'Unidentified':['Land-dwelling','Aquatic','Winged','Other / unknown']
});
export const cryptidCategories=Object.freeze(Object.keys(cryptidTaxonomy));
export const genres=Object.freeze(['Non-fiction','Fiction']);
export const nonfictionLabels=Object.freeze(['Claimed Encounter','Research/Commentary']);
export const fictionLabels=Object.freeze(['Fiction','Art','AI-Generated']);
export function genreForLabel(label){
 return nonfictionLabels.includes(label)?'Non-fiction':'Fiction';
}
export function genreForRecord(record){
 const inferred=genreForLabel(record?.label);
 return genres.includes(record?.genre)&&isValidGenreLabel(record.genre,record?.label)?record.genre:inferred;
}
export function isValidGenreLabel(genre,label){
 return genre==='Non-fiction'?nonfictionLabels.includes(label):genre==='Fiction'&&fictionLabels.includes(label);
}
export function validSubcategory(category,value){return value===''||value==null||Boolean(cryptidTaxonomy[category]?.includes(value))}
