<script lang="ts">
	import Spinner from '../spinner/Spinner.svelte';

	let { src, alt, title }: { src: string; alt: string; title?: string } = $props();
</script>

{#if src.startsWith('#upload-')}
	<span class="pending"><Spinner /> {alt}</span>
{:else}
	<img {src} {alt} {title} loading="lazy" />
{/if}

<style>
	.pending {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.3em 0.6em;
		border: 1px dashed var(--border-bright, #d3d1cc);
		border-radius: var(--radius, 8px);
		color: var(--muted, #64625d);
		font-size: 0.85em;
	}
</style>
