// with prefers-reduced-motion: reduce, nothing on the site may move.
// usage: node scripts/motion-check.mjs [base url]   (needs playwright; PLAYWRIGHT=<path to its index.mjs> to point at one)
const { chromium } = await import(process.env.PLAYWRIGHT ?? 'playwright');
const base = process.argv[2] ?? 'http://localhost:5173';
const PAGES = ['/', '/stats', '/career', '/speaking', '/blog/neotraverse-1-0', '/does-not-exist'];

const running = () => document.getAnimations().filter((a) => a.playState === 'running').length;
const b = await chromium.launch();
let bad = 0;
for (const theme of ['light', 'dark']) {
	const p = await b.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: theme, reducedMotion: 'reduce' });
	for (const path of PAGES) {
		await p.goto(base + path, { waitUntil: 'networkidle' });
		await p.waitForTimeout(400);
		const sky0 = await p.evaluate(() => [document.querySelector('.mtn .sun')?.getAttribute('transform'), document.querySelector('.b-id')?.style.getPropertyValue('--n')]);
		// poke everything that could move: scroll through, hover each clay object, flip the theme
		await p.evaluate(async () => {
			window.__vt = 0;
			const vt = document.startViewTransition?.bind(document);
			if (vt) document.startViewTransition = (f) => (window.__vt++, vt(f));
			for (let y = 0; y < document.body.scrollHeight; y += 600) (scrollTo(0, y), await new Promise((r) => setTimeout(r, 30)));
			scrollTo(0, 0);
		});
		for (const c of await p.locator('.clay').all()) await c.hover({ force: true }).catch(() => {});
		const anims = await p.evaluate(running);
		await p.click('[data-theme-toggle]');
		await p.waitForTimeout(1500);
		const after = await p.evaluate(running);
		const vts = await p.evaluate(() => window.__vt);
		const sky1 = await p.evaluate(() => [document.querySelector('.mtn .sun')?.getAttribute('transform'), document.querySelector('.b-id')?.style.getPropertyValue('--n')]);
		const still = JSON.stringify(sky0) === JSON.stringify(sky1);
		const ok = anims === 0 && after === 0 && vts === 0 && still;
		if (!ok) bad++;
		console.log(`${ok ? 'ok  ' : 'FAIL'} ${theme.padEnd(5)} ${path.padEnd(24)} running=${anims}/${after} view-transitions=${vts} sky ${still ? 'still' : 'moved'}`);
	}
	await p.close();
}
await b.close();
process.exit(bad ? 1 : 0);
