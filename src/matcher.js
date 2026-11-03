// Transparent text-evidence matching. No external APIs, personal-attribute scoring or hiring decisions.
export const catalog = [
  ['Nursing qualification', ['diploma in nursing', 'bachelor of nursing', 'bachelor of science in nursing', 'bsc nursing'], 3],
  ['Medical degree', ['mbbs', 'mbchb', 'bachelor of medicine', 'doctor of medicine'], 3],
  ['Business / marketing degree', ['bachelor of business', 'degree in marketing', "bachelor's degree in marketing", 'bachelor of marketing', 'bba'], 3],
  ['Nursing Board registration', ['malaysian nursing board', 'nursing board malaysia', 'lembaga jururawat malaysia', 'ljm'], 3],
  ['Medical Council registration', ['malaysian medical council', 'mmc'], 3],
  ['Annual Practising Certificate', ['annual practising certificate', 'annual practicing certificate', 'apc'], 3],
  ['Basic Life Support', ['basic life support', 'bls'], 2],
  ['Advanced Cardiovascular Life Support', ['advanced cardiovascular life support', 'advanced cardiac life support', 'acls'], 2],
  ['Patient assessment', ['patient assessment', 'nursing assessment'], 2],
  ['Clinical assessment', ['clinical assessment', 'clinical evaluation'], 2],
  ['Medication administration', ['medication administration', 'administer medication', 'administer prescribed medication'], 2],
  ['Wound care', ['wound care', 'wound management'], 2],
  ['Infection control', ['infection control', 'infection prevention'], 2],
  ['Patient safety', ['patient safety'], 2],
  ['Emergency medicine', ['emergency medicine', 'emergency department', 'acute care'], 2],
  ['Clinical documentation', ['clinical documentation', 'medical documentation'], 1],
  ['Electronic medical records', ['electronic medical records', 'electronic health records', 'emr', 'ehr'], 1],
  ['Patient education', ['patient education'], 1],
  ['Teamwork', ['teamwork', 'multidisciplinary team', 'multidisciplinary teams', 'team collaboration'], 1],
  ['Quality improvement', ['quality improvement', 'clinical audit', 'clinical audits'], 1],
  ['Business development', ['business development'], 2],
  ['Healthcare marketing', ['healthcare marketing', 'health care marketing', 'hospital marketing'], 2],
  ['Corporate partnerships', ['corporate partnerships', 'corporate partnership', 'corporate accounts'], 2],
  ['Stakeholder management', ['stakeholder management', 'stakeholder engagement', 'stakeholder relationships'], 2],
  ['Market research', ['market research', 'market analysis'], 2],
  ['Sales reporting', ['sales reporting', 'sales reports', 'sales performance reporting'], 1],
  ['CRM', ['crm', 'customer relationship management'], 1],
  ['Digital marketing', ['digital marketing', 'online marketing'], 2],
  ['Event management', ['event management', 'event coordination'], 1],
  ['Campaign management', ['campaign management', 'marketing campaigns', 'marketing campaign'], 1],
  ['Budget management', ['budget management', 'budgeting', 'budget planning'], 1],
  ['Microsoft Excel', ['microsoft excel', 'ms excel'], 1],
  ['Project management', ['project management'], 2],
];
export const normalize = value => String(value ?? '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[–—-]/g, ' ').replace(/[^a-z0-9+'\s]/g, ' ').replace(/\s+/g, ' ').trim();
const escaped = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function contains(text, term) {
  const needle = normalize(term);
  return Boolean(needle && new RegExp(`(?:^|[^a-z0-9])${escaped(needle)}(?=$|[^a-z0-9])`, 'i').test(normalize(text)));
}
const excluded = /\b(age|male|female|gender|sex|race|ethnicity|religion|marital|nationality|citizenship|pregnan|disability|date of birth|address|salary|remuneration|benefits|contact|email|phone|language|bahasa|mandarin|english)\b/i;
const stop = new Set('a an the and or of in to for with is are be as at on by from must should have has will able ability minimum required preferred experience years year skills proficiency proficient certification certified strong excellent good knowledge relevant candidate candidates we our you your responsibilities requirements qualifications position role job description current equivalent related discipline'.split(' '));
export function extractRequirements(jd) {
  const lines = jd.split(/\n/).map(x => x.trim()).filter(Boolean);
  const requirements = [];
  let preferred = false;
  let responsibilities = false;
  const searchable = lines.map(line => {
    if (/^preferred\b|^desirable\b|^nice to have\b/i.test(line)) preferred = true;
    if (/^requirements\b|^essential\b|^qualifications\b/i.test(line)) { preferred = false; responsibilities = false; }
    if (/^responsibilities\b|^duties\b|^about (us|the role)\b/i.test(line)) responsibilities = true;
    return {line, preferred, responsibilities};
  });
  for (const [label, terms, weight] of catalog) {
    const hits = searchable.filter(x => !x.responsibilities && !excluded.test(x.line) && terms.some(term => contains(x.line, term)));
    if (hits.length) requirements.push({id: crypto.randomUUID(), label, terms: [...terms], weight, required: hits.some(x => !x.preferred), kind: 'term'});
  }
  const exp = jd.match(/(?:minimum|at least|min\.?|over|more than)?\s*(\d{1,2})(?:\s*[-–]\s*\d{1,2})?\+?\s*years?\s+(?:of\s+)?(?:(?:relevant|clinical|work|professional|related|working)\s+)*experience/i);
  if (exp) requirements.push({id: crypto.randomUUID(), label: `At least ${exp[1]} years of experience`, terms: [], minYears: Number(exp[1]), weight: 2, required: true, kind: 'years'});
  // Preserve unsupported criteria as editable phrases; never pretend to semantically understand them.
  for (const {line, preferred, responsibilities} of searchable) {
    if (responsibilities || excluded.test(line) || !/^[-•*]|^\d+[.)]|\b(must|required|minimum|experience in|proficien|certifi|degree|diploma)\b/i.test(line)) continue;
    if (catalog.some(([,terms]) => terms.some(term => contains(line, term))) || /\byears?\b/i.test(line)) continue;
    const label = line.replace(/^[-•*\d.)\s]+/, '').replace(/[.;]$/, '').trim();
    const tokens = normalize(label).split(' ').filter(w => w.length > 2 && !stop.has(w));
    if (tokens.length && label.length <= 240) requirements.push({id: crypto.randomUUID(), label, terms: [...new Set(tokens)], weight: 1, required: !preferred, kind: 'phrase'});
  }
  return requirements.slice(0, 40);
}
function evidenceLines(text) {
  return text.split(/\n|(?<=[.!?;])\s+/).map(line => line.trim()).filter(line => line && !/fictional sample|all employers|not a real application|phone:|email:|@example\.com/i.test(line));
}
function uncertain(line, term) {
  const text = normalize(line), index = text.indexOf(normalize(term));
  const before = text.slice(Math.max(0, index - 70), index), after = text.slice(index + normalize(term).length, index + normalize(term).length + 65);
  return /\b(no|not|without|lack|lacks|lacking|never|pending|pursuing|awaiting|expired|planned|seeking|intend|enrolled|studying)\b/.test(before)
    || /\b(expired|pending|not held|not completed|in progress|not current|not yet|not registered)\b/.test(after);
}
export function evaluateRequirement(requirement, cv) {
  const lines = evidenceLines(cv);
  if (requirement.kind === 'years') {
    const claims = lines.flatMap(line => {
      const regex = /\b(\d{1,2})(?:\.\d)?\+?\s*years?\s+(?:of\s+)?(?:(?:relevant|clinical|work|professional|related|working|total|nursing|medical|marketing|sales)\s+)*(?:experience|practice)\b/gi;
      return [...line.matchAll(regex)].filter(hit => !uncertain(line, hit[0])).map(hit => ({value: Number(hit[1]), line}));
    });
    const best = claims.sort((a,b) => b.value - a.value)[0];
    if (!best) return {status: 'review', evidence: '', note: 'No explicit experience total found. Review the work history; dates are not inferred.'};
    return {status: best.value >= requirement.minYears ? 'found' : 'missing', evidence: best.line, note: `${best.value} years explicitly stated; relevance and overlapping roles need recruiter review.`};
  }
  if (requirement.kind === 'phrase') {
    const terms = requirement.terms.map(normalize).filter(Boolean);
    const hit = lines.find(line => terms.length && terms.every(term => contains(line, term)));
    if (hit) return {status: uncertain(hit, terms[0]) ? 'review' : 'found', evidence: hit, note: 'Phrase keywords found together. Check that they support the actual requirement.'};
    const partial = lines.find(line => terms.some(term => contains(line, term)));
    return {status: partial ? 'review' : 'missing', evidence: partial || '', note: partial ? 'Only part of this custom criterion was found.' : 'No supporting phrase found in this CV.'};
  }
  const hits = lines.flatMap(line => requirement.terms.filter(term => contains(line, term)).map(term => ({line, term})));
  const positive = hits.find(hit => !uncertain(hit.line, hit.term));
  if (positive) return {status: 'found', evidence: positive.line, note: 'Text evidence only. Confirm qualifications, registration, validity and context independently.'};
  if (hits.length) return {status: 'review', evidence: hits[0].line, note: 'Mention found with a negative, pending or expired context. Check manually.'};
  return {status: 'missing', evidence: '', note: 'No matching text found. This does not prove the candidate lacks this requirement.'};
}
export function matchCandidate(candidate, requirements) {
  const criteria = requirements.map(req => ({...req, ...evaluateRequirement(req, candidate.text)}));
  const total = criteria.reduce((n,r) => n + Number(r.weight), 0);
  const earned = criteria.filter(r => r.status === 'found').reduce((n,r) => n + Number(r.weight), 0);
  return {...candidate, criteria, score: total ? Math.round(earned / total * 100) : 0,
    found: criteria.filter(r => r.status === 'found').length,
    gaps: criteria.filter(r => r.required && r.status !== 'found').length,
    review: criteria.filter(r => r.status === 'review').length};
}
export function csvEscape(value) {
  let text = String(value ?? '');
  // Spreadsheet formula injection protection, including leading whitespace.
  if (/^\s*[=+@-]/.test(text) || /^[\t\r]/.test(text)) text = "'" + text;
  return `"${text.replaceAll('"','""')}"`;
}
export function makeCSV(results) {
  const rows = [['Candidate','Evidence match (%)','Criterion','Essential','Weight','Text status','CV excerpt','Reviewer note']];
  results.forEach(result => result.criteria.forEach(criterion => rows.push([result.name,result.score,criterion.label,criterion.required ? 'Yes' : 'No',criterion.weight,criterion.status,criterion.evidence,criterion.note])));
  return '\ufeff' + rows.map(row => row.map(csvEscape).join(',')).join('\r\n');
}
