// Server-side creator accounting. No wallet, Suffering tip, or AI membership
// is ever recognized as withdrawable subscription income here.
export const moneyPolicy=Object.freeze({currency:'USD',provider:'paypal',source:'creator-subscription',payoutsEnabled:false,payoutReviewRequired:true});
const cents=n=>Number.isSafeInteger(n)&&n>=0&&n<=100000000000;
export function reconcileEarnings({earnings=[],payouts=[],merchantId='',now=Date.now()}={}){
 const seen=new Set();let earned=0,pending=0,refunded=0,committed=0,paid=0,untrusted=0;
 if(!merchantId)return {earned_cents:0,pending_cents:0,available_cents:0,committed_cents:0,paid_cents:0,refunded_cents:0,untrusted_records:earnings.length,payouts_enabled:false};
 for(const e of earnings){
  const valid=e.provider==='paypal'&&e.source_type==='creator-subscription'&&e.currency==='USD'&&
    e.provider_merchant_id===merchantId&&e.verified_payment===true&&
    e.provider_status==='COMPLETED'&&e.status==='settled'&&
    /^[a-zA-Z0-9_-]{6,120}$/.test(String(e.provider_capture_id||''))&&
    cents(e.creator_amount_cents)&&cents(e.gross_cents)&&cents(e.processor_fee_cents)&&cents(e.platform_fee_cents)&&
    e.creator_amount_cents<=e.gross_cents&&
    e.creator_amount_cents+e.processor_fee_cents+e.platform_fee_cents<=e.gross_cents;
  if(!valid||seen.has(e.provider_capture_id)){untrusted++;continue}
  seen.add(e.provider_capture_id);
  // Refunded or reversed charges are reserved; they cannot fund withdrawals.
  const reversal=cents(e.refunded_cents)?Math.min(e.creator_amount_cents,e.refunded_cents):0;
  const chargeback=cents(e.reversed_cents)?Math.min(e.creator_amount_cents-reversal,e.reversed_cents):0;
  const net=e.creator_amount_cents-reversal-chargeback;refunded+=reversal+chargeback;
  if(!e.available_at||!Number.isFinite(Date.parse(e.available_at))||Date.parse(e.available_at)>now)pending+=net;
  else earned+=net;
 }
 const payoutIds=new Set();
 for(const p of payouts){
  if(p.provider!=='paypal'||p.currency!=='USD'||!cents(p.amount_cents)||!p.id||payoutIds.has(p.id)){untrusted++;continue}
  payoutIds.add(p.id);
  if(['requested','under_review','processing','on_hold','unclaimed'].includes(p.status))committed+=p.amount_cents;
  else if(p.status==='completed'&&String(p.provider_item_id||'').length>=6&&p.verified_payout===true)paid+=p.amount_cents;
 }
 // Do not show negative withdrawable funds; expose flagged data to operator.
 return {earned_cents:earned,pending_cents:pending,available_cents:Math.max(0,earned-committed-paid),committed_cents:committed,paid_cents:paid,refunded_cents:refunded,untrusted_records:untrusted,payouts_enabled:false};
}
export function payoutRequestPolicy({accountVerified=false,marketplaceApproved=false,webhooksVerified=false,ledgerAtomic=false,payoutPermission=false}={}){
 const missing=Object.entries({accountVerified,marketplaceApproved,webhooksVerified,ledgerAtomic,payoutPermission}).filter(([,v])=>v!==true).map(([k])=>k);
 return {enabled:missing.length===0,missing};
}
