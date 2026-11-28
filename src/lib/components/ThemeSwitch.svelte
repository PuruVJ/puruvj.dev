<!-- one button: device → light → dark → sunrise → sunset → device. the icon shows the mode in use: a
     screen while the page follows the device, a sun, a moon, a half sun on the horizon with its
     rays, and a sun sinking under it. no island: the click handler is a tiny inline script in
     the layout (see $lib/site.ts), and css picks the icon from <html data-pref-theme>. -->
<button type="button" class="theme" data-theme-toggle aria-label="theme: device, light, dark, sunrise or sunset" title="theme: device, light, dark, sunrise, sunset">
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
	<svg class="rise" viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
		<path d="M4.8 12a3.2 3.2 0 0 1 6.4 0z" fill="currentColor" />
		<g stroke="currentColor" stroke-width="1.2" stroke-linecap="round" fill="none">
			<path d="M1 12.6h14" />
			<path d="M8 7V5.3M11.21 8.17l1.1-1.3M4.79 8.17l-1.1-1.3M12.89 10.96l1.66-.35M3.11 10.96l-1.66-.35" />
		</g>
	</svg>
	<svg class="set" viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
		<path d="M3.6 9.4a4.4 4.4 0 0 1 8.8 0z" fill="currentColor" />
		<g stroke="currentColor" stroke-width="1.2" stroke-linecap="round" fill="none">
			<path d="M1 10h14M4.5 12.4h7M6.5 14.6h3" />
		</g>
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
	:global(:root:is([data-pref-theme='light'], [data-pref-theme='dark'], [data-pref-theme='sunrise'], [data-pref-theme='sunset'])) .sys {
		display: none;
	}
	:global(:root[data-pref-theme='light']) .sun,
	:global(:root[data-pref-theme='dark']) .moon,
	:global(:root[data-pref-theme='sunrise']) .rise,
	:global(:root[data-pref-theme='sunset']) .set {
		display: block;
	}
</style>
