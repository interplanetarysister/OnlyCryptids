export const cryptidTaxonomy=Object.freeze({
 'Bigfoot':['Sasquatch / Pacific Northwest','Skunk ape / Southeast','Yowie / Australia','Yeti / Himalayas','Other hairy hominids'],
 'Mothman':['Point Pleasant accounts','Other regional accounts','Original winged interpretations'],
 'Lake monsters':['Loch Ness monster','Champ / Lake Champlain','Other lake cryptids','Original lake creatures'],
 'Chupacabra':['Reptilian interpretations','Canine interpretations','Other interpretations'],
 'Jersey Devil':['Pine Barrens accounts','Classic winged depictions','Original interpretations'],
 'Sea creatures':['Sea serpents','Kraken / giant cephalopods','Other ocean cryptids','Original sea creatures'],
 'Unidentified':['Land-dwelling','Aquatic','Winged','Other / unknown']
});
export function validSubcategory(category,value){return value===''||value==null||Boolean(cryptidTaxonomy[category]?.includes(value))}
