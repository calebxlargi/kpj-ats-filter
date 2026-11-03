import test from 'node:test';
import assert from 'node:assert/strict';
import {contains, extractRequirements, evaluateRequirement, matchCandidate, csvEscape, makeCSV} from '../src/matcher.js';
import {samples, sampleRoles} from '../src/samples.js';
const term = (label,terms=[label]) => ({id:'test',label,terms,kind:'term',weight:2,required:true});
test('Sample roles favour corresponding job evidence without sorting candidates',()=>{
 for(const s of sampleRoles){
  const criteria=extractRequirements(s.jd);
  const matched=sampleRoles.map(c=>matchCandidate({name:c.name,text:c.cv},criteria));
  const own=matched[sampleRoles.indexOf(s)];
  assert.ok(own.score>=85, `${s.role}: ${own.score}`);
  for(const other of matched.filter(c=>c!==own)) assert.ok(own.score>other.score,`${s.role} expected own match above unrelated profile`);
 }
});
test('Preferred budget requirement is omitted from business CV and flagged',()=>{
 const s=samples[2], r=matchCandidate({text:s.cv},extractRequirements(s.jd));
 const budget=r.criteria.find(c=>c.label==='Budget management');
 assert.equal(budget.required,false); assert.equal(budget.status,'missing');assert.ok(r.score<100);
});
test('Registration and degree requirements are explicit for the nurse and doctor',()=>{
 const nursing=extractRequirements(samples[0].jd), medical=extractRequirements(samples[1].jd);
 assert.ok(nursing.some(x=>x.label==='Nursing qualification'&&x.required));
 assert.ok(nursing.some(x=>x.label==='Nursing Board registration'&&x.required));
 assert.ok(medical.some(x=>x.label==='Medical degree'&&x.required));
 assert.ok(medical.some(x=>x.label==='Medical Council registration'&&x.required));
});
test('Token boundaries prevent APC matching within unrelated words',()=>{
 assert.equal(contains('capcom and sapcloud','apc'),false);
 assert.equal(contains('Current APC.','apc'),true);
 assert.equal(contains('Current A.P.C.','apc'),false);
});
test('Synonyms match and negated, expired or pending mentions require review',()=>{
 const r=term('BLS',['bls','basic life support']);
 assert.equal(evaluateRequirement(r,'Basic Life Support certification completed').status,'found');
 for(const text of ['No BLS certification','BLS expired in 2024','Awaiting BLS training','BLS not yet completed']) assert.equal(evaluateRequirement(r,text).status,'review',text);
});
test('Unmentioned requirements are not evidence',()=>assert.equal(evaluateRequirement(term('wound care'),'Nurse with unrelated qualifications.').status,'missing'));
test('Experience compares explicit totals, never counts education dates',()=>{
 const r={kind:'years',minYears:3};
 assert.equal(evaluateRequirement(r,'I have 4 years of clinical experience.').status,'found');
 assert.equal(evaluateRequirement(r,'2 years of relevant experience.').status,'missing');
 assert.equal(evaluateRequirement(r,'Education: 2010 - 2026.').status,'review');
 assert.equal(evaluateRequirement(r,'No 5 years of experience.').status,'review');
});
test('Personal attributes are excluded from generated scoring criteria',()=>{
 const criteria=extractRequirements('- Age under 35\n- Female only\n- Malaysian nationality\n- Religion: Islam\n- Marital status: single\n- English language\n- Clinical assessment experience');
 assert.equal(criteria.length,1);assert.equal(criteria[0].label,'Clinical assessment');
});
test('Custom job requirements become editable keyword checks',()=>{
 const requirements=extractRequirements('LOGISTICS COORDINATOR\nRequirements\n- Proficiency in warehouse inventory reconciliation.');
 assert.equal(requirements.length,1);assert.equal(requirements[0].kind,'phrase');
 assert.equal(evaluateRequirement(requirements[0],'Experienced in warehouse inventory reconciliation.').status,'found');
});
test('Weights affect scores and review context earns no positive evidence',()=>{
 const r=matchCandidate({text:'BLS completed.\nACLS expired.'},[term('BLS'),{...term('ACLS'),weight:1}]);
 assert.equal(r.score,67);assert.equal(r.gaps,1);assert.equal(r.review,1);
});
test('CSV output quotes content and neutralises spreadsheet formulas',()=>{
 assert.equal(csvEscape('=HYPERLINK("https://bad.example")'), '"\'=HYPERLINK(""https://bad.example"")"');
 assert.equal(csvEscape('  +cmd'), '"\'  +cmd"');
 assert.equal(csvEscape('ordinary, text'),'"ordinary, text"');
 assert.ok(makeCSV([]).startsWith('\ufeff"Candidate"'));
});
