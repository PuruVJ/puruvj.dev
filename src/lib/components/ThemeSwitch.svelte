<!-- one button: device → light → dark → device. the icon shows the mode in use: a screen while the
     page follows the device, a sun, a moon. no island: the click handler is a tiny inline script in
     the layout (see $lib/site.ts), and css picks the icon from <html data-pref-theme>. -->
<button type="button" class="theme" data-theme-toggle aria-label="theme: device, light or dark" title="theme: device, light, dark">
	<svg class="sys" viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
		<rect x="1.5" y="2.5" width="13" height="8.5" rx="1" fill="none" stroke="currentColor" stroke-width="1.2" />
		<path d="M5.5 14h5M8 11v3" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" />
	</svg>
	<svg class="sun" viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
		<circle cx="8" cy="8" r="3" fill="currentColor" />
		<g stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
			<path d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3.05 3.05l1.13 1.13M11.82 11.82l1.13 1.13M3.05 12.95l1.13-1.13M11.82 4.18l1.13-1.13" />
		</g>
	</svg>
	<svg class="moon" viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
		<path d="M13.6 10.2A6 6 0 0 1 5.8 2.4a6 6 0 1 0 7.8 7.8z" fill="currentColor" />
	</svg>
</button>

<style>
	.theme {
		all: unset;
		cursor: pointer;
		display: inline-grid;
		place-items: center;
		width: 22px;
		height: 22px;
		margin: -4px -4px -4px 0;
		color: var(--ink-2);
		align-self: center;
	}
	.theme:hover {
		color: var(--ink);
	}
	.theme:focus-visible {
		outline: 1.5px solid var(--ink);
		outline-offset: 2px;
	}
	svg {
		grid-area: 1 / 1;
		display: none;
	}
	/* following the device unless a choice is stored */
	.sys {
		display: block;
	}
	:global(:root[data-pref-theme='light']) .sys,
	:global(:root[data-pref-theme='dark']) .sys {
		display: none;
	}
	:global(:root[data-pref-theme='light']) .sun,
	:global(:root[data-pref-theme='dark']) .moon {
		display: block;
	}
</style>
