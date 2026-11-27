<script lang="ts">
	import { page } from '$app/state';

	// the tags link previews read (discord, slack, x, imessage...). urls must be absolute.
	let { title, description, image }: { title: string; description: string; image: string } = $props();
	const origin = $derived((page.data as { origin?: string }).origin ?? 'https://puruvj.dev');
</script>

<meta property="og:type" content="website" />
<meta property="og:site_name" content="puru vijayvargia" />
<meta property="og:url" content="{origin}{page.url.pathname}" />
<meta property="og:title" content={title} />
<meta property="og:description" content={description} />
<meta property="og:image" content="{origin}{image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content={title} />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@puruvjdev" />
<meta name="twitter:title" content={title} />
<meta name="twitter:description" content={description} />
<meta name="twitter:image" content="{origin}{image}" />
