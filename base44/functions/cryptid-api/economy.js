// Shared server/client catalog. Rename here without changing accounting units.
export const creditPolicy=Object.freeze({name:'Suffering',unitCents:25,currency:'USD',version:'suffering-usd-25c-v1',cashRedemption:false,purchasedCreditsGrantEntries:false,welcomeUnits:5,aiGenerationUnits:1,creatorTipMinimum:1});
export const creditPacks=Object.freeze([4,20,40,100].map(units=>({id:`suffering-${units}`,units,priceCents:units*creditPolicy.unitCents})));
export function creditCost(units){if(!Number.isSafeInteger(units)||units<1||units>100000)throw new Error('Use a whole number of Suffering from 1 to 100,000.');return {units,priceCents:units*creditPolicy.unitCents,currency:creditPolicy.currency,policyVersion:creditPolicy.version}}

// These are immutable product rules. No wallet debit/grant may run without an
// atomic ledger, idempotency keys, and a real AI provider completion receipt.
export function generationQuote(mode){if(!['story','photo-story','refine','art'].includes(mode))throw new Error('Unknown AI generation mode.');return {mode,units:creditPolicy.aiGenerationUnits,usdCents:creditPolicy.aiGenerationUnits*creditPolicy.unitCents,chargeOn:'success',autoPublish:false}}
export function tipQuote(units){if(!Number.isSafeInteger(units)||units<1||units>100)throw new Error('Tip a whole number of 1 to 100 Suffering.');return {units,usdCents:units*creditPolicy.unitCents,canCashOut:false}}
