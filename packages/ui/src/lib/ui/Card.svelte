<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		accent,
		interactive = false,
		children
	}: { accent?: string; interactive?: boolean; children: Snippet } = $props();
</script>

<div class="card" class:accent={!!accent} class:interactive style:--accent-rail={accent}>
	{@render children()}
</div>

<style>
	.card {
		position: relative;
		background: var(--surface, #fff);
		border: 1px solid var(--border, #333);
		border-radius: var(--radius, 8px);
		box-shadow: var(--shadow-1);
		padding: 1.1em;
	}

	.card.accent {
		padding-left: calc(1.1em - 2px);
		border-left: 3px solid var(--accent-rail);
	}

	.card.interactive {
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease,
			transform 0.15s ease;
	}

	.card.interactive:hover {
		border-color: var(--border-bright, #555);
		box-shadow: var(--shadow-2);
		transform: translateY(-1px);
	}

	.card.interactive.accent:hover {
		border-left-color: var(--accent-rail);
	}
</style>
