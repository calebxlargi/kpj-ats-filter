import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {samples, sampleRoles} from '../src/samples.js';
import {extractRequirements,matchCandidate} from '../src/matcher.js';

test('Library has 12 unique profiles and exactly three job templates',()=>{
 assert.equal(samples.length,12);assert.equal(sampleRoles.length,3);
 for(const key of ['id','file','name'])assert.equal(new Set(samples.map(s=>s[key])).size,12);
 for(const role of sampleRoles) assert.equal(samples.filter(s=>s.roleId===role.id).length,4);
});
test('Each role has strong, partial and limited additional evidence scenarios',()=>{
 for(const role of sampleRoles){
  const added=samples.filter(s=>s.roleId===role.id&&s.id!==role.id);
  const evaluated=added.map(s=>matchCandidate({name:s.name,text:s.cv},extractRequirements(role.jd)));
  assert.ok(evaluated[0].score>=95,role.role+' strong evidence');
  assert.ok(evaluated[1].score>=35&&evaluated[1].score<=80,role.role+' partial evidence');
  assert.ok(evaluated[2].score<35,role.role+' limited evidence');
 }
});
test('Negative clinical credential scenarios trigger manual context review',()=>{
 for(const [id,label] of [['nurse-mei','Basic Life Support'],['nurse-kavitha','Nursing Board registration'],['doctor-arvind','Advanced Cardiovascular Life Support'],['doctor-jason','Medical Council registration']]){
  const sample=samples.find(s=>s.id===id);
  const result=matchCandidate({text:sample.cv},extractRequirements(sample.jd));
  assert.equal(result.criteria.find(c=>c.label===label).status,'review',id+' '+label);
 }
});
test('Downloadable CV text matches in-app content and each sample PDF exists',()=>{
 for(const sample of samples){
  const root=new URL('../public/samples/',import.meta.url);
  assert.equal(readFileSync(new URL(sample.file+'.txt',root),'utf8').trim(),sample.cv.trim());
  assert.equal(readFileSync(new URL(sample.file+'.pdf',root)).subarray(0,4).toString(),'%PDF');
  assert.ok(sample.cv.includes('@example.com'));assert.ok(sample.cv.includes('fictional, non-dialable'));
 }
 assert.equal(readFileSync(new URL('../public/samples/additional-test-cvs.zip',import.meta.url)).subarray(0,2).toString(),'PK');
});
