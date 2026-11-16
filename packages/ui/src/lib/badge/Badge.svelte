<script module lang="ts">
	/** Named after the state it reports, not the colour it uses. */
	export type Tone = 'muted' | 'pending' | 'progress' | 'done' | 'danger' | 'accent' | 'info';
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';

	let { tone = 'muted', children }: { tone?: Tone; children: Snippet } = $props();
</script>

<span class="badge {tone}">{@render children()}</span>

<style>
	/* A soft tinted pill: the fill is a wash of the tone and the text the tone pulled a
	   quarter toward ink, which keeps every tone at AA on its own wash in both themes. */
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
		color: color-mix(in oklab, var(--tone) 75%, var(--ink));
		background: color-mix(in oklab, var(--tone) 11%, transparent);
	}

	.muted {
		color: var(--muted);
		background: var(--surface-2);
	}

	.pending {
		--tone: var(--pending);
	}

	.progress {
		--tone: var(--progress);
	}

	.done {
		--tone: var(--done);
	}

	.danger {
		--tone: var(--danger);
	}

	.accent {
		--tone: var(--accent);
	}

	.info {
		--tone: var(--info);
	}
</style>
