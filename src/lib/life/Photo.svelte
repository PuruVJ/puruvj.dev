<script lang="ts">
	import { Img, type ImageDescriptor } from '@ogygia/image';

	// a photo, or until there is one, a ruled block the same shape with its name on it.
	// to put the real photo in, give `of` an import.meta.og.image(...) of it: nothing else changes.
	let {
		of = null,
		name,
		alt = '',
		aspect = '4/5',
		width = 480,
	}: {
		of?: ImageDescriptor | null;
		name: string;
		alt?: string;
		aspect?: string;
		width?: number;
	} = $props();
</script>

<figure class="photo" style:aspect-ratio={aspect.replace('/', ' / ')}>
	{#if of}
		<Img {of} {alt} {aspect} {width} layout="constrained" />
	{:else}
		<div class="slot" aria-hidden="true"><span>photo · {name}</span></div>
	{/if}
</figure>

<style>
	.photo {
		position: relative;
		width: 100%;
		overflow: hidden;
		outline: 1px solid var(--hair);
		outline-offset: -1px;
	}
	.photo :global(img) {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: grayscale(1) contrast(1.05);
	}
	.photo :global(img:hover) {
		filter: none;
	}
	@media (prefers-reduced-motion: no-preference) {
		.photo :global(img) {
			transition: filter 0.4s ease;
		}
	}
	/* ruled in pencil, like the unannounced project on /work */
	.slot {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: flex-end;
		padding: 12px 14px;
		background:
			repeating-linear-gradient(-45deg, transparent 0 9px, var(--hair) 9px 10px),
			var(--paper-2);
	}
	.slot span {
		font-family: var(--mono);
		font-size: 10.5px;
		color: var(--ink-3);
		background: var(--paper-2);
		padding: 2px 5px;
	}
</style>
