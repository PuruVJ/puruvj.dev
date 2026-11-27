<script lang="ts">
	// the toy shelf's island: a few hundred bytes. it waits for the page to settle, then (only if
	// the device can take it) pulls in three.js and the toys. until then, and for anyone it skips,
	// the shelf shows still sprites of the same toys.

	const POSTER = [
		{ id: 'duck', at: 6, pat: 13, w: 114, h: 80, phone: true },
		{ id: 'dice', at: 16.5, pat: 37, w: 96, h: 51, phone: true },
		{ id: 'banana', at: 29, pat: 61, w: 134, h: 46, phone: true },
		{ id: 'mic', at: 47, w: 67, h: 94 },
		{ id: 'computer', at: 59, pat: 86, w: 130, h: 98, phone: true },
		{ id: 'papers', at: 71, w: 123, h: 43 },
	];

	function can_play() {
		if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
		const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
		if (nav.connection?.saveData) return false;
		if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return false;
		try {
			const c = document.createElement('canvas');
			const gl = c.getContext('webgl2') ?? c.getContext('webgl');
			if (!gl) return false;
			gl.getExtension('WEBGL_lose_context')?.loseContext();
		} catch {
			return false;
		}
		return true;
	}

	const settled = () =>
		new Promise<void>((done) => {
			const after_load = () =>
				document.fonts.ready.then(() => {
					const idle = window.requestIdleCallback ?? ((f: () => void) => setTimeout(f, 200));
					idle(() => setTimeout(done, 1200), { timeout: 4000 });
				});
			if (document.readyState === 'complete') after_load();
			else addEventListener('load', after_load, { once: true });
		});

	const near = (el: Element) =>
		new Promise<void>((done) => {
			const io = new IntersectionObserver(
				(es) => {
					if (!es.some((e) => e.isIntersecting)) return;
					io.disconnect();
					done();
				},
				{ rootMargin: '300px 0px' },
			);
			io.observe(el);
		});

	/** wake the toys: after load, fonts, an idle moment and a short pause, and only near the screen */
	function toys(el: HTMLElement) {
		if (!can_play()) return;
		let dead = false;
		let stop: (() => void) | undefined;
		(async () => {
			await settled();
			await near(el);
			if (dead) return;
			const { mount } = await import('./shelf.ts');
			if (dead) return;
			stop = await mount(el, { phone: el.clientWidth < 600, onReady: () => el.classList.add('live') });
			if (dead) stop();
		})().catch(() => {});
		return () => {
			dead = true;
			stop?.();
		};
	}
</script>

<div class="toys" {@attach toys}>
	<div class="poster" aria-hidden="true">
		{#each POSTER as p (p.id)}
			<span class="still" class:desk={!p.phone} style="--at: {p.at}%; --pat: {p.pat ?? p.at}%; width: {p.w}px; height: {p.h}px">
				<img src="/clay/{p.id}.webp" alt="" loading="lazy" decoding="async" class="day" />
				<img src="/clay/{p.id}-dark.webp" alt="" loading="lazy" decoding="async" class="night" />
			</span>
		{/each}
	</div>
</div>

<style>
	/* the shelf's height is fixed from the first paint, so waking the toys never moves the page */
	.toys {
		position: relative;
		height: 112px;
		overflow: hidden;
		touch-action: pan-y;
	}
	.toys :global(.toys-canvas) {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
		opacity: 0;
	}
	.toys:global(.live) :global(.toys-canvas) {
		opacity: 1;
	}
	.toys:global(.live) .poster {
		opacity: 0;
	}
	@media (prefers-reduced-motion: no-preference) {
		.toys :global(.toys-canvas),
		.poster {
			transition: opacity 0.5s ease;
		}
	}
	.poster {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.still {
		position: absolute;
		left: var(--at);
		bottom: 0;
		overflow: hidden;
		transform: translateX(-50%);
	}
	.still img {
		display: block;
		width: 400%;
		height: 100%;
	}
	.night {
		display: none !important;
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-pref-theme='light'])) .day {
			display: none !important;
		}
		:global(:root:not([data-pref-theme='light'])) .night {
			display: block !important;
		}
	}
	:global(:root[data-pref-theme='dark']) .day {
		display: none !important;
	}
	:global(:root[data-pref-theme='dark']) .night {
		display: block !important;
	}

	.toys :global(.toys-label) {
		position: absolute;
		left: 0;
		top: 0;
		z-index: 2;
		font-family: var(--mono);
		font-size: 10.5px;
		color: var(--ink-2);
		background: var(--paper);
		padding: 2px 6px;
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
	}
	.toys :global(.toys-label.on) {
		opacity: 1;
		pointer-events: auto;
	}
	.toys :global(.toys-label[href]:hover) {
		color: var(--ink);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.toys :global(.toys-mute) {
		all: unset;
		position: absolute;
		top: 8px;
		right: 12px;
		z-index: 2;
		font-family: var(--mono);
		font-size: 10px;
		color: var(--ink-3);
		cursor: pointer;
	}
	.toys :global(.toys-mute:hover) {
		color: var(--ink);
	}
	.toys :global(.toys-mute:focus-visible) {
		outline: 1.5px solid var(--ink);
		outline-offset: 2px;
	}
	@media (max-width: 760px) {
		.toys {
			height: 88px;
		}
		.desk {
			display: none;
		}
		/* the phone row spreads its four stills across the whole width, like the live toys */
		.still {
			left: var(--pat);
			scale: 0.8;
			transform-origin: bottom center;
		}
	}
</style>
