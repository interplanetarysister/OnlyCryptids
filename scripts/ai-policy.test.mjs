import test from 'node:test';
import assert from 'node:assert/strict';
import {aiPlans,aiModes,featuresForPlan,makeOnlyCryptidsBrief,normalizeProtectedTerms} from '../base44/functions/cryptid-api/onlycryptids-ai.js';

test('free members cannot unlock any AI feature',()=>{
 assert.deepEqual(featuresForPlan('explorer'),[]);
 assert.deepEqual(featuresForPlan('unexpected'),[]);
});
test('story membership does not unlock paid image rendering',()=>{
 assert.deepEqual(featuresForPlan('field-researcher'),['story','photo-story','refine']);
 assert.ok(!featuresForPlan('field-researcher').includes('art'));
 assert.ok(featuresForPlan('cryptid-creator').includes('art'));
 assert.equal(aiPlans[1].monthlyCents,800);
 assert.equal(aiPlans[2].monthlyCents,1500);
});
test('All four creative modes are named and gated',()=>{
 assert.deepEqual(Object.keys(aiModes),['story','photo-story','refine','art']);
});
test('preserves newly coined proper nouns and requests spell-check without altering lore',()=>{
 const brief=makeOnlyCryptidsBrief({
   mode:'refine',idea:'I met the Wraithy-Kelr on a lonely ridge at midnight.',
   protectedTerms:'Wraithy-Kelr, Nameless, Wraithy-Kelr'
 });
 assert.deepEqual(brief.protectedTerms,['Wraithy-Kelr','Nameless']);
 assert.match(brief.system,/unfamiliar proper nouns/);
 assert.match(brief.system,/Correct genuine spelling/);
 assert.match(brief.user,/Wraithy-Kelr/);
 assert.equal(brief.publishAutomatically,false);
 assert.equal(brief.label,'AI-Generated');
});
test('Unknown cryptid names survive normalization',()=>{
 assert.deepEqual(normalizeProtectedTerms('Naru-Ash, River Warden, Naru-Ash'),['Naru-Ash','River Warden']);
});
test('prompt excludes nonconsensual personalization and preserves opt-in samples as data',()=>{
 const b=makeOnlyCryptidsBrief({mode:'story',idea:'The footsteps stopped when I stopped.'},{interests:['ghost-stories','unlisted-private-theme'],writingSamples:['My own public story.']});
 assert.match(b.user,/ghost-stories/);
 assert.doesNotMatch(b.user,/unlisted-private-theme/);
 assert.match(b.user,/My own public story/);
 assert.match(b.system,/story data/);
});
test('short editing submissions and blank submissions are rejected',()=>{
 assert.throws(()=>makeOnlyCryptidsBrief({mode:'refine',idea:'hi'}),/at least/);
 assert.throws(()=>makeOnlyCryptidsBrief({idea:'  '}),/Describe/);
});
test('photo-story preview does not falsely claim image pixel analysis',()=>{
 const b=makeOnlyCryptidsBrief({mode:'photo-story',imageContext:'A silhouette in an old family picture.'});
 assert.match(b.user,/no image pixels have been examined/);
 assert.equal(b.imageRequired,true);
});
