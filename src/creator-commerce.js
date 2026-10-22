export const merchandisePolicy={draft:true,creatorShareBasisPoints:3000,profitBasis:'net merchandise profit',products:['Hoodies','T-shirts','Cups & mugs','Posters','Stickers'],requiresSignedCopyrightAssignment:true,requiresDesignApproval:true,requiresVerifiedVotes:true,automaticPublication:false};

// Preview calculation only. Actual payouts require the accepted per-design terms,
// verified order costs/refunds, and an approved payment account.
export function previewCreatorShare({netSalesCents,productionCents,fulfillmentCents,processingCents,refundCents,shareBasisPoints=3000}){
 for(const value of [netSalesCents,productionCents,fulfillmentCents,processingCents,refundCents,shareBasisPoints])if(!Number.isSafeInteger(value)||value<0)throw new Error('Use nonnegative integer amounts.');
 if(shareBasisPoints>10000)throw new Error('The share cannot exceed 100%.');
 const deductions=productionCents+fulfillmentCents+processingCents+refundCents;
 if(!Number.isSafeInteger(deductions))throw new Error('Amounts exceed supported limits.');
 const profitCents=Math.max(0,netSalesCents-deductions);
 const creatorCents=Number(BigInt(profitCents)*BigInt(shareBasisPoints)/10000n);
 return {profitCents,creatorCents,platformCents:profitCents-creatorCents};
}

// Preview shortlist: one verified account's vote per content per round.
// Eligibility, fraud review, closing time and licensing are enforced server-side
// before this helper can ever determine a real featured product.
export function previewMerchShortlist(contents,votes){
 const eligible=contents.filter(c=>c.license_status==='signed-assignment'&&c.moderation_status==='approved');
 const unique=new Set();const totals=new Map();
 for(const v of votes){if(!v.verified||!v.user_id||!v.content_id||!v.round_id)continue;const key=JSON.stringify([v.round_id,v.user_id,v.content_id]);if(unique.has(key))continue;unique.add(key);totals.set(v.content_id,(totals.get(v.content_id)||0)+1)}
 return eligible.map(c=>({...c,verifiedVotes:totals.get(c.id)||0})).sort((a,b)=>b.verifiedVotes-a.verifiedVotes||a.id.localeCompare(b.id));
}

export const creatorDonationRequirements={
 eligibility:'active creator membership verified on the server',
 crypto:{enabled:false,requiresAddressOwnershipProof:true,requiresExplicitNetwork:true,custodial:false,acceptSeedPhrases:false},
 fiat:{enabled:false,provider:'PayPal',requiresCreatorOnboarding:true},
 disclosures:['Confirm recipient and network before donating.','A donation does not buy sweepstakes entries or improved odds.','Creator donations and platform subscription charges are separate.']
};
