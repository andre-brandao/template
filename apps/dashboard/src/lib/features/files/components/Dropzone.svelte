<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		enabled,
		onfiles,
		children
	}: { enabled: boolean; onfiles: (files: FileList) => void; children: Snippet } = $props();

	let drag = $state(0);
</script>

<div
	class="zone"
	class:drop={drag > 0}
	role="region"
	aria-label="Files"
	ondragenter={(e) => {
		if (!enabled) return;
		if (!e.dataTransfer?.types.includes('Files')) return;
		e.preventDefault();
		drag += 1;
	}}
	ondragover={(e) => e.preventDefault()}
	ondragleave={() => (drag = Math.max(0, drag - 1))}
	ondrop={(e) => {
		e.preventDefault();
		drag = 0;
		if (e.dataTransfer?.files.length) onfiles(e.dataTransfer.files);
	}}
>
	{@render children()}

	{#if drag > 0}
		<div class="overlay">Drop files to upload</div>
	{/if}
</div>

<style>
	.zone {
		position: relative;
		min-height: 60vh;
	}

	.overlay {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		border: 2px dashed var(--accent);
		border-radius: var(--radius, 8px);
		background: color-mix(in srgb, var(--surface) 80%, transparent);
		color: var(--ink);
		font-family: var(--font-mono);
		pointer-events: none;
	}
</style>
