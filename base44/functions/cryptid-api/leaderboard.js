// OnlyCryptids provisional monthly recognition. Prize selection is NEVER
// automatic. Public stats are not a promise of winning or a payment incentive.
export const scoreCategories=Object.freeze(['engagement','community_support','creativity','fear','cryptid']);
export const scoreLabels=Object.freeze({engagement:'Engagement',community_support:'Community support',creativity:'Creativity',fear:'Fear scale',cryptid:'Cryptid scale'});
export function monthKey(date=new Date()){
 const d=new Date(date);if(!Number.isFinite(d.getTime()))throw new Error('Invalid date.');
 return d.toISOString().slice(0,7);
}
export function contentLane(post){
 const type=post?.label==='AI-Generated'?'ai':'human';
 const format=['Art','Photo'].includes(post?.format)?'images':'stories';
 return type+'-'+format;
}
export function starRange(n){return Number.isInteger(n)&&n>=1&&n<=5}
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const average=(list,field)=>list.length?list.reduce((sum,r)=>sum+r[field],0)/list.length:0;
// Platform operators keep prize rules and detailed judging judgments outside
// client source; this is only a provisional community-signal order.
export function scoreProvisional({post,ratings=[],likes=[],comments=[],tips=[],referrals=[]}){
 const author=post.user_id;
 const eligibleRatings=ratings.filter(r=>r.post_id===post.id&&r.user_id!==author&&scoreCategories.every(k=>starRange(r[k])));
 const uniqueRatings=[...new Map(eligibleRatings.map(r=>[r.user_id,r])).values()];
 const verifiedComments=new Set(comments.filter(c=>c.post_id===post.id&&c.status==='visible'&&c.user_id!==author).map(c=>c.user_id)).size;
 const uniqueLikes=new Set(likes.filter(l=>l.target_id===post.id&&l.kind==='like'&&l.user_id!==author).map(l=>l.user_id)).size;
 const validTips=tips.filter(t=>t.content_id===post.id&&t.status==='settled'&&t.from_user_id!==author&&t.to_user_id===author&&Number.isSafeInteger(t.units)&&t.units>0);
 const tipUnits=validTips.reduce((s,t)=>s+t.units,0);
 const distinctSupporters=new Set(validTips.map(t=>t.from_user_id)).size;
 const engaged=verifiedComments+uniqueLikes;
 const hasRated=uniqueRatings.length>=3;
 const metrics={
  engagement:hasRated?clamp(Math.round(average(uniqueRatings,'engagement')),1,5):clamp(1+Math.floor(Math.log2(1+engaged)),1,5),
  community_support:hasRated?clamp(Math.round(average(uniqueRatings,'community_support')),1,5):clamp(1+Math.floor(Math.log2(1+verifiedComments)),1,5),
  creativity:hasRated?clamp(Math.round(average(uniqueRatings,'creativity')),1,5):null,
  fear:hasRated?clamp(Math.round(average(uniqueRatings,'fear')),1,5):null,
  cryptid:hasRated?clamp(Math.round(average(uniqueRatings,'cryptid')),1,5):null
 };
 // Cryptid relevance dominates the provisional ranking. Quality categories
 // with fewer than three independent ratings are not assigned fake stars.
 const rankScore=(metrics.cryptid??0)*5+(metrics.creativity??0)*2+
  (metrics.fear??0)+(metrics.engagement)*1.3+(metrics.community_support);
 const verifiedReferralCount=referrals.filter(r=>r.referrer_user_id===author&&r.status==='verified'&&
   r.referee_user_id&&r.referee_user_id!==author&&r.engagement_verified===true).length;
 return {ratings:metrics,rater_count:uniqueRatings.length,likes:uniqueLikes,comments:verifiedComments,
  tip_units:tipUnits,tipper_count:distinctSupporters,referral_engagement:verifiedReferralCount,
  provisional_score:hasRated?Math.round(rankScore*100)/100:0,
  has_enough_ratings:hasRated};
}
export function buildMonthlyBoards({posts=[],creators=[],ratings=[],interactions=[],comments=[],tips=[],referrals=[],month=monthKey(),limit=10}){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))throw new Error('Invalid month.');
 const people=new Map(creators.filter(c=>c.status==='active').map(c=>[c.id,c]));
 const lanes={'human-stories':[],'human-images':[],'ai-stories':[],'ai-images':[]};
 const tipped=[];
 for(const post of posts){
  // Do not index draft, hidden or paid private bodies in public boards.
  const creator=people.get(post.creator_id);
  if(!creator||post.status!=='published'||post.visibility!=='free'||post.demo||post.created_date?.slice(0,7)!==month)continue;
  const stats=scoreProvisional({post,ratings,likes:interactions,comments,tips,referrals});
  const entry={post_id:post.id,creator_id:post.creator_id,handle:creator.handle,
   display_name:creator.display_name,title:post.title,format:post.format,
   lane:contentLane(post),...stats};
  lanes[entry.lane].push(entry);
  tipped.push(entry);
 }
 const byRank=(a,b)=>b.provisional_score-a.provisional_score||b.rater_count-a.rater_count||String(a.post_id).localeCompare(String(b.post_id));
 const byTips=(a,b)=>b.tip_units-a.tip_units||b.tipper_count-a.tipper_count||String(a.post_id).localeCompare(String(b.post_id));
 const results={};
 for(const [lane,items] of Object.entries(lanes))results[lane]=items.sort(byRank).slice(0,limit).map((x,i)=>({...x,rank:i+1}));
 const highestTipped=tipped.filter(x=>x.tip_units>0).sort(byTips).slice(0,limit).map((x,i)=>({...x,rank:i+1}));
 return {month,provisional:true,prize_awarding_enabled:false,prize_winner:null,
  notice:'Community rankings are provisional. Purchased Suffering and tip amounts do not improve prize eligibility. Prize award rules and independent judging are not active.',
  lanes:results,top_tipped:highestTipped};
}
