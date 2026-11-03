# KPJ Talent Match

A static, browser-only CV screening workspace prepared for KPJ Hospitals. Paste a job description, upload or paste CVs, review editable requirements, and inspect the evidence behind each match.

**No backend, database, accounts, analytics, AI API, or server-side document processing.** All input text and results remain in the current tab's memory. Refreshing clears the workspace; downloaded files remain on the user's device. The hosting provider still receives ordinary requests for the site and may retain request logs. Do not add analytics or external document-processing services without revisiting these privacy claims.

## Use

1. Paste a job description or select one of three sample roles.
2. Open **Review & edit criteria**. Check extracted requirements, alternatives, essential flags, and weights. Editing the job description regenerates the criteria.
3. Upload PDF, DOCX or TXT files, or paste candidate text. Up to 20 candidates, 10 MB per file, 50 pages per PDF. Scanned PDFs need text pasted separately; there is no OCR. Password-protected PDFs must be unlocked first.
4. Compare candidates. Select a candidate to expand criterion evidence and inspect the extracted source text.
5. Export the evidence to CSV if needed. Inputs changing after comparison mark the results as stale and disable export until compared again.

**Try with sample CVs** loads a Staff Nurse job description and all 12 fictional CVs. Other sample roles are Medical Officer and Business Development Executive. Each role has four profiles: its original sample and three additional candidates with strong, partial and limited evidence. The sample library groups profiles by role and includes PDF and TXT downloads plus a ZIP of the nine additional CVs. All candidate names, employers, education providers, contacts and credentials are fictional, and job descriptions are demonstration examples rather than official KPJ vacancies. Phone numbers are intentionally non-dialable and emails use example.com.

## What matching means

This is a deterministic text-evidence tool, not semantic AI and not a hiring recommendation. Candidates remain in the order added; the app does not automatically reject, shortlist or decide whom to hire.

- Recognises common nursing, medical and business terms using an editable synonym dictionary.
- Converts other short bullet requirements to editable keyword checks. It cannot interpret every free-form job description; users must review the extracted criteria and add missed requirements.
- Looks for whole-term matches and returns a supporting CV excerpt. Custom phrase checks require all their keywords in a single line/sentence; partial matches need review.
- Flags common negative, expired and pending contexts for manual review. This is a heuristic, not full language understanding.
- Uses explicit years-of-experience statements. It does not infer durations from dates, relevance of experience or overlapping roles.
- Calculates `text match = found criterion weights / all criterion weights × 100`. Preferred criteria still affect the percentage. Context-review and missing criteria receive zero evidence weight. Essential gaps are displayed separately.
- Excludes common personal-attribute, language and contact requirements from automatically generated criteria. Names and contact details do not enter the scoring formula. Manually entered criteria are the recruiter's responsibility.
- Does not authenticate files, verify licences, validate expiry dates, assess competence or detect keyword stuffing. A mention is only a mention. Not finding text does not prove absence of a qualification.

## Development

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Production build and tests:

```sh
npm test
npm run build
npm run preview
```

The deployed application consists only of the files in `dist/`. PDF.js and Mammoth are loaded on demand from the same origin, including the PDF worker; no CDN or external fonts are used. CV text is rendered as escaped text, never uploaded HTML. Exported CSV cells are quoted and protected against formula injection. `_headers` supplies Cloudflare security headers, including a same-origin content security policy.

## Cloudflare Pages

Create a **Pages** project connected to `calebxlargi/kpj-ats-filter`:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | Repository root |
| Node version | 22 (set `NODE_VERSION=22` if the platform default differs) |

No environment secrets, bindings, functions or database are needed. The `.node-version` file declares Node 22. GitHub Actions runs the matching tests and production build on pushes and pull requests. Cloudflare's Git integration publishes main automatically; its deployment build is separate from GitHub CI and does not wait for CI, so run tests before pushing changes.

## Sample files

`public/samples/` includes all 12 CVs in PDF and TXT plus the three job descriptions in TXT. `src/samples.js` owns the content. If editing sample content, regenerate the TXT files and PDFs together. `scripts/generate-samples.py` regenerates the PDFs using Python's `reportlab` (an authoring dependency only, not required to build or run the app).

## Structure

- `src/main.js`: workspace interactions, rendering and CSV export
- `src/matcher.js`: criterion extraction, evidence matching and score calculation
- `src/files.js`: client-side PDF, DOCX and TXT parsing
- `src/samples.js` and `src/additional-samples.js`: fictional CVs and demonstration job descriptions
- `tests/matcher.test.js`: meaningful matching and export regression checks
- `public/_headers`: static hosting response headers

Prepared as a recruitment prototype. Uses the KPJ Healthcare identity and gold brand colour #978467. The complete vector logo from https://kpj.listedcompany.com/images/img/kpj-logo.svg replaces the cropped reference image; its paths are rendered in the requested gold.
