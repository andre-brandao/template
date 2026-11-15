<!-- A file on its way up: pulses while it sends, stays red with the reason if it fails. -->
<script lang="ts">
	import { Status } from '@template/ui';
	import Upload from '@lucide/svelte/icons/upload';
	import X from '@lucide/svelte/icons/x';
	import { size } from '$lib/utils/size';

	let {
		file,
		error,
		ondismiss
	}: { file: File; error?: string; ondismiss: () => void } = $props();
</script>

<li class={['row', { failed: error }]}>
	<span class="icon"><Upload size={16} strokeWidth={1.75} /></span>
	<span class="name">{file.name}</span>
	<Status state={error ? 'failed' : 'pending'} message={error} />
	<span class="meta">{size(file.size)}</span>
	{#if error}
		<button class="dismiss" aria-label="Dismiss {file.name}" onclick={ondismiss}>
			<X size={14} strokeWidth={1.75} />
		</button>
	{/if}
</li>

<style>
	.row {
		display: grid;
		grid-template-columns: 1.6em minmax(0, 1fr) 0.5em auto 1.9em;
		align-items: center;
		gap: 0.75em;
		min-height: 2.6em;
		padding: 0.25em 0.4em 0.25em 0.7em;
		border-bottom: 1px solid var(--border);
		color: var(--muted);
		animation: enter 140ms ease-out;
	}

	.icon {
		display: grid;
		place-items: center;
		color: var(--dim);
	}

	.failed .icon {
		color: var(--danger);
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta {
		color: var(--dim);
		font-size: 0.82em;
		font-variant-numeric: tabular-nums;
	}

	.dismiss {
		grid-column: 5;
		display: grid;
		place-items: center;
		width: 1.9em;
		height: 1.9em;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--muted);
		cursor: pointer;
	}

	.dismiss:hover {
		background: var(--hover);
		color: var(--ink);
	}

	.dismiss:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -1px;
	}

	@keyframes enter {
		from {
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.row {
			animation: none;
		}
	}
</style>
