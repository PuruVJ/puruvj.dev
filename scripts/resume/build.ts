// prints scripts/resume/resume.html to static/resume.pdf, with chromium (playwright).
//   pnpm resume
// playwright isn't a dependency of the site. this uses the one node can find, or the file named
// by PLAYWRIGHT (a path to playwright's index.mjs).
import { fileURLToPath, pathToFileURL } from 'node:url';
import { statSync } from 'node:fs';

const html = new URL('./resume.html', import.meta.url);
const out = fileURLToPath(new URL('../../static/resume.pdf', import.meta.url));
const MAX_PAGES = 2;

async function playwright() {
	if (process.env.PLAYWRIGHT) return import(pathToFileURL(process.env.PLAYWRIGHT).href);
	try {
		return await import('playwright');
	} catch {
		console.error('no playwright found. install it, or run with PLAYWRIGHT=/path/to/playwright/index.mjs');
		process.exit(1);
	}
}

const { chromium } = await playwright();
const browser = await chromium.launch();
try {
	const page = await browser.newPage();
	await page.emulateMedia({ media: 'print' });
	await page.goto(html.href, { waitUntil: 'load' });
	await page.evaluate(() => document.fonts.ready);

	// every font has to load: a missing file would quietly fall back to arial
	const missing = await page.evaluate(async () => {
		const faces = [...document.fonts];
		await Promise.allSettled(faces.map((f) => f.load()));
		return faces.filter((f) => f.status !== 'loaded').map((f) => `${f.family} ${f.weight}`);
	});
	if (missing.length) throw new Error(`fonts did not load: ${missing.join(', ')}`);

	// each .page is one A4 sheet with overflow hidden: anything that spills over would be cut off
	const spill = await page.evaluate(() =>
		[...document.querySelectorAll('.page')].flatMap((p, i) =>
			[...p.querySelectorAll('.b')]
				.filter((b) => {
					// the last thing in a block has to end above the block's bottom padding
					const last = b.lastElementChild?.getBoundingClientRect().bottom ?? 0;
					const pad = parseFloat(getComputedStyle(b).paddingBottom);
					return last > b.getBoundingClientRect().bottom - pad + 1;
				})
				.map((b) => `page ${i + 1}: ${b.querySelector('.h')?.textContent?.trim()}`),
		),
	);
	// and the blocks together have to fit their page
	spill.push(
		...(await page.evaluate(() =>
			[...document.querySelectorAll('.page')].flatMap((p, i) =>
				p.scrollHeight > p.clientHeight + 1 ? [`page ${i + 1} is ${p.scrollHeight - p.clientHeight}px too tall`] : [],
			),
		)),
	);
	if (spill.length) throw new Error(`content runs out of its block:\n  ${spill.join('\n  ')}`);

	const pages = await page.locator('.page').count();
	if (pages > MAX_PAGES) throw new Error(`${pages} pages, want at most ${MAX_PAGES}`);

	await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true, tagged: true });
	console.log(`wrote static/resume.pdf: ${pages} pages, ${Math.round(statSync(out).size / 1024)} KB`);
} finally {
	await browser.close();
}
