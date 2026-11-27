<script lang="ts">
	import NotFound from '$lib/components/NotFound.svelte';
</script>

<!-- the old site published its not-found page at /404; keep that address -->
<NotFound status={404} path="/404" />
