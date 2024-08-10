<script lang="ts">
	import type { GetImageResult } from 'astro';

	export let avif: GetImageResult | null = null;
	export let webp: GetImageResult;
	export let src: string;
	export let alt: string;
</script>

<div>
	<figure>
		<picture>
			{#if avif}
				<source type="image/avif" srcset={avif.srcSet.attribute} />
			{/if}

			<source type="image/webp" srcset={webp.srcSet.attribute} />
			<img data-blog-image-lazy {src} {alt} {...webp.attributes} />
		</picture>
	</figure>
</div>

<style>
	div {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
	}

	figure {
		margin: 0;
		padding: 0;
		background-color: pink;
		height: max-content;
	}

	img {
		/* opacity: 0; */
		transition: opacity 0.3s ease-in-out;
	}
</style>
