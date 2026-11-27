<!-- one button: flips light and dark. until the first click the page follows the system.
     no island: the click handler is a tiny inline script in the layout (see $lib/site.ts). -->
<button type="button" class="theme" data-theme-toggle aria-label="switch between light and dark" title="light / dark">
	<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true">
		<circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.2" />
		<path d="M8 1.5a6.5 6.5 0 0 1 0 13z" fill="currentColor" />
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
		transition: transform 0.4s cubic-bezier(0.3, 0.7, 0.2, 1);
	}
	/* dark: the filled half swings to the other side */
	:global(:root[data-pref-theme='dark']) svg {
		transform: rotate(180deg);
	}
	@media (prefers-color-scheme: dark) {
		:global(:root:not([data-pref-theme='light'])) svg {
			transform: rotate(180deg);
		}
	}
</style>
