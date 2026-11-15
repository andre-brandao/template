<script lang="ts" module>
	export type State = 'idle' | 'pending' | 'saved' | 'failed';

	/** The slice of a TanStack mutation (or anything shaped like one) that `of` reads. */
	type Of = {
		isPending: boolean;
		isError: boolean;
		isSuccess: boolean;
		error?: { message?: string } | null;
	};
</script>

<script lang="ts">
	import { announce } from '../toast/announce.svelte';

	// A dot, not words: colour carries the state, the title is for hover, and a failure is
	// read out once through the Toaster's announcer.
	let {
		of,
		state,
		message
	}: {
		/** One or more mutations: pending beats failed beats saved. */
		of?: Of | Of[];
		/** Explicit state for anything that isn't a mutation; wins over `of`. */
		state?: State;
		message?: string;
	} = $props();

	const all = $derived(of ? [of].flat() : []);
	const shown = $derived<State>(
		state ??
			(all.some((one) => one.isPending)
				? 'pending'
				: all.some((one) => one.isError)
					? 'failed'
					: all.some((one) => one.isSuccess)
						? 'saved'
						: 'idle')
	);
	const label = $derived(
		{
			idle: '',
			pending: 'Saving',
			saved: 'Saved',
			failed: message ?? all.find((one) => one.isError)?.error?.message ?? 'Not saved'
		}[shown]
	);

	$effect(() => {
		if (shown === 'failed') announce(label);
	});
</script>

<span class={['dot', shown]} title={label || undefined}>
	{#if shown === 'failed'}<span class="sr">{label}</span>{/if}
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
		background: var(--pending);
		animation: pulse 0.9s ease-in-out infinite;
	}

	/* Flashes, then gets out of the way: a saved row needs no marker. */
	.saved {
		background: var(--done);
		animation: fade 1.2s ease-out forwards;
	}

	.failed {
		background: var(--danger);
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
