// Shared server/client catalog. Rename here without changing accounting units.
export const creditPolicy=Object.freeze({name:'Suffering',unitCents:25,currency:'USD',version:'suffering-usd-25c-v1',cashRedemption:false,purchasedCreditsGrantEntries:false});
export const creditPacks=Object.freeze([4,20,40,100].map(units=>({id:`suffering-${units}`,units,priceCents:units*creditPolicy.unitCents})));
export function creditCost(units){if(!Number.isSafeInteger(units)||units<1||units>100000)throw new Error('Use a whole number of Suffering from 1 to 100,000.');return {units,priceCents:units*creditPolicy.unitCents,currency:creditPolicy.currency,policyVersion:creditPolicy.version}}
