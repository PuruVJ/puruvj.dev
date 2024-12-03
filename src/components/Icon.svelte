<script lang="ts">
	interface Props {
		path: string;
		size?: number;
	}

	let { path, size = 24 }: Props = $props();
</script>

<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24">
	<path d={path} />
</svg>
