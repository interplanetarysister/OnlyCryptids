import test from 'node:test';
import assert from 'node:assert/strict';
import {cryptidTaxonomy,cryptidCategories,genres,genreForLabel,genreForRecord,isValidGenreLabel,validSubcategory} from '../base44/functions/cryptid-api/taxonomy.js';

test('requested categories exist exactly once',()=>{
 const expected=['Skinwalkers','Aliens','Ghosts','Chupacabra','Alien technologies','Sacred space sightings','Dreamscape'];
 for(const category of expected)assert.equal(cryptidCategories.filter(name=>name===category).length,1,category);
 assert.equal(new Set(cryptidCategories).size,cryptidCategories.length);
 assert.equal(cryptidCategories.length,Object.keys(cryptidTaxonomy).length);
});
test('all categories permit their listed subcategories and reject unrelated combinations',()=>{
 for(const [category,subcategories] of Object.entries(cryptidTaxonomy)){
   assert.ok(subcategories.length>0,category);
   for(const sub of subcategories)assert.equal(validSubcategory(category,sub),true,category+'/'+sub);
 }
 assert.equal(validSubcategory('Dreamscape','Point Pleasant accounts'),false);
});
test('editorial genres separate fiction from self-reported real accounts and documentary research',()=>{
 assert.deepEqual([...genres],['Non-fiction','Fiction']);
 for(const label of ['Fiction','Art','AI-Generated']){
   assert.equal(genreForLabel(label),'Fiction');assert.equal(isValidGenreLabel('Non-fiction',label),false);
 }
 for(const label of ['Claimed Encounter','Research/Commentary']){
   assert.equal(genreForLabel(label),'Non-fiction');assert.equal(isValidGenreLabel('Fiction',label),false);
 }
 assert.equal(genreForRecord({label:'Claimed Encounter'}),'Non-fiction');
 assert.equal(genreForRecord({label:'AI-Generated'}),'Fiction');
 assert.equal(genreForRecord({label:'Fiction',genre:'Non-fiction'}),'Fiction');
 assert.equal(genreForRecord({label:'Research/Commentary',genre:'Non-fiction'}),'Non-fiction');
});
