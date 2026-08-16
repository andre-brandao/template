<script module lang="ts">
	/** Named after the state it reports, not the colour it uses. */
	export type Tone = 'muted' | 'pending' | 'progress' | 'done' | 'danger' | 'accent';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	let { tone = 'muted', children }: { tone?: Tone; children: Snippet } = $props();
</script>

<span class="badge {tone}">{@render children()}</span>

<style>
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		padding: 0.15em 0.5em;
		border: 1px solid var(--border, #333);
		border-radius: var(--radius, 6px);
		font-family: var(--font-mono, monospace);
		font-size: 0.75em;
		line-height: 1.5;
		white-space: nowrap;
		color: var(--muted, #666);
	}

	/* One shape, one rule per tone: the text takes the token and the border takes a
	   wash of it, so a row of mixed badges keeps the same weight. */
	.pending {
		border-color: color-mix(in srgb, var(--pending) 45%, transparent);
		color: var(--pending);
	}

	.progress {
		border-color: color-mix(in srgb, var(--progress) 45%, transparent);
		color: var(--progress);
	}

	.done {
		border-color: color-mix(in srgb, var(--done) 45%, transparent);
		color: var(--done);
	}

	.danger {
		border-color: color-mix(in srgb, var(--danger) 45%, transparent);
		color: var(--danger);
	}

	.accent {
		border-color: color-mix(in srgb, var(--accent) 45%, transparent);
		color: var(--accent);
	}
</style>
