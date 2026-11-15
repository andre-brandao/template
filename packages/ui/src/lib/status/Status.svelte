<script lang="ts" module>
	export type State = 'idle' | 'pending' | 'saved' | 'failed';
</script>

<script lang="ts">
	// A dot, not words: colour carries the state, and the label is for screen readers and hover.
	let { state, message }: { state: State; message?: string } = $props();

	const label = $derived(
		{ idle: '', pending: 'Saving', saved: 'Saved', failed: message ?? 'Not saved' }[state]
	);
</script>

<span class={['dot', state]} title={label || undefined} role="status" aria-live="polite">
	<span class="sr">{label}</span>
</span>

<style>
	.dot {
		display: inline-block;
		flex: none;
		width: 0.5em;
		height: 0.5em;
		border-radius: 50%;
		background: transparent;
		vertical-align: middle;
		transition: background-color 140ms ease;
	}

	.pending {
		background: var(--pending, #6b6a64);
		animation: pulse 0.9s ease-in-out infinite;
	}

	/* Flashes, then gets out of the way: a saved row needs no marker. */
	.saved {
		background: var(--done, #2f7f68);
		animation: fade 1.2s ease-out forwards;
	}

	.failed {
		background: var(--danger, #b8452c);
	}

	.sr {
		position: absolute;
		width: 1px;
		height: 1px;
		margin: -1px;
		overflow: hidden;
		clip-path: inset(50%);
		white-space: nowrap;
	}

	@keyframes pulse {
		50% {
			opacity: 0.35;
		}
	}

	@keyframes fade {
		70% {
			opacity: 1;
		}
		to {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.pending {
			animation: none;
		}
	}
</style>
