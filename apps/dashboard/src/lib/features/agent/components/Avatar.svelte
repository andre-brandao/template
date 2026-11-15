<!--
	The assistant's mark, ringed by what it is doing: a turning ring while it thinks, a soft
	pulse while it writes, a steady ring and a "?" while a form waits on the user.
-->
<script lang="ts">
	import Sparkles from '@lucide/svelte/icons/sparkles';

	type State = 'idle' | 'thinking' | 'writing' | 'waiting';

	let { size = 28, state = 'idle' }: { size?: number; state?: State } = $props();

	const labels: Record<State, string> = {
		idle: 'Assistant',
		thinking: 'Assistant thinking',
		writing: 'Assistant writing',
		waiting: 'Assistant waiting on your answer'
	};
</script>

<span class={['avatar', state]} style:--size="{size}px" role="img" aria-label={labels[state]}>
	<span class="face"><Sparkles size={Math.round(size * 0.55)} strokeWidth={1.75} /></span>
	{#if state === 'waiting'}<span class="badge" aria-hidden="true">?</span>{/if}
</span>

<style>
	.avatar {
		position: relative;
		display: inline-flex;
		flex: none;
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
	}

	.face {
		position: relative;
		z-index: 1;
		display: grid;
		place-items: center;
		width: 100%;
		height: 100%;
		border-radius: 50%;
		box-shadow: 0 0 0 1px var(--border);
		background: var(--surface-2);
		color: var(--accent);
	}

	/* The ring sits just outside the mark, under it. */
	.avatar::before {
		content: '';
		position: absolute;
		inset: -2px;
		border-radius: 50%;
		opacity: 0;
		transition: opacity 200ms;
	}

	.thinking::before {
		opacity: 1;
		background: conic-gradient(
			from 0deg,
			transparent 0deg,
			var(--accent) 140deg,
			color-mix(in srgb, var(--accent) 30%, transparent) 220deg,
			transparent 360deg
		);
		animation: spin 1.6s linear infinite;
	}

	.writing::before {
		opacity: 1;
		background: var(--accent);
		animation: pulse 1.4s ease-in-out infinite;
	}

	.waiting::before {
		opacity: 1;
		background: var(--accent);
	}

	.thinking .face,
	.writing .face,
	.waiting .face {
		box-shadow: 0 0 0 1px var(--surface);
	}

	.badge {
		position: absolute;
		right: -3px;
		bottom: -3px;
		z-index: 2;
		display: grid;
		place-items: center;
		width: max(12px, calc(var(--size) * 0.36));
		height: max(12px, calc(var(--size) * 0.36));
		border: 1.5px solid var(--surface);
		border-radius: 50%;
		background: var(--accent);
		color: var(--accent-ink);
		font-size: max(8px, calc(var(--size) * 0.24));
		font-weight: 700;
		line-height: 1;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			opacity: 0.35;
		}
		50% {
			opacity: 1;
		}
	}

	/* Still rings: the state reads from the colour alone. */
	@media (prefers-reduced-motion: reduce) {
		.thinking::before,
		.writing::before {
			animation: none;
		}

		.thinking::before {
			background: color-mix(in srgb, var(--accent) 60%, transparent);
		}
	}
</style>
