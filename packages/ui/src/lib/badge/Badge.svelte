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
	/* A soft tinted pill: the text takes the tone and the fill a wash of it, so a row of
	   mixed badges keeps one weight. */
	.badge {
		display: inline-flex;
		align-items: center;
		gap: 0.35em;
		padding: 0.1em 0.55em;
		border-radius: 999px;
		font-size: 0.86em;
		font-weight: 500;
		line-height: 1.5;
		white-space: nowrap;
		color: var(--muted, #666);
		background: var(--surface-2, #f2f2f2);
	}

	.pending {
		color: var(--pending);
		background: color-mix(in oklab, var(--pending) 11%, transparent);
	}

	.progress {
		color: var(--progress);
		background: color-mix(in oklab, var(--progress) 11%, transparent);
	}

	.done {
		color: var(--done);
		background: color-mix(in oklab, var(--done) 11%, transparent);
	}

	.danger {
		color: var(--danger);
		background: color-mix(in oklab, var(--danger) 11%, transparent);
	}

	.accent {
		color: var(--accent);
		background: color-mix(in oklab, var(--accent) 12%, transparent);
	}
</style>
