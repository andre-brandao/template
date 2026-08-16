<script lang="ts">
	import type { Snippet } from 'svelte';
	import Drawer from '../drawer/Drawer.svelte';
	import { combobox } from './ctx.svelte';

	let { title, children }: { title?: string; children: Snippet } = $props();

	const ctx = combobox();

	// Arrow keys walk whatever options are in the DOM right now, so nothing has to
	// register itself — the query has already removed the rest.
	function keys(e: KeyboardEvent & { currentTarget: HTMLElement }) {
		if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
		e.preventDefault();
		const options = [...e.currentTarget.querySelectorAll<HTMLElement>('[role="option"]')];
		if (!options.length) return;
		const at = options.indexOf(document.activeElement as HTMLElement);
		const next = e.key === 'ArrowDown' ? at + 1 : at - 1;
		options[((next % options.length) + options.length) % options.length].focus();
	}
</script>

{#snippet panel()}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class={['panel', { sheet: ctx.narrow }]} onkeydown={keys}>
		{#if title}<p class="title">{title}</p>{/if}
		{@render children()}
	</div>
{/snippet}

{#if ctx.narrow}
	<Drawer open={ctx.open} side="bottom" onclose={() => ctx.set(false)}>
		{@render panel()}
	</Drawer>
{:else if ctx.open}
	<div class="pop">
		{@render panel()}
	</div>
{/if}

<style>
	.pop {
		position: absolute;
		z-index: 10;
		inset-inline-start: 0;
		top: calc(100% + 0.4em);
		/* Grows past a narrow trigger rather than clipping labels. */
		min-width: 100%;
		width: max-content;
		max-width: min(22em, calc(100vw - 2em));
		border: 1px solid var(--border, #333);
		border-radius: var(--radius, 8px);
		background: var(--surface, #fff);
		box-shadow: var(--shadow-2, 0 12px 28px -14px rgb(0 0 0 / 0.6));
	}

	.panel {
		display: flex;
		flex-direction: column;
		min-height: 0;
		padding: 0.35em;
	}

	/* Thumb-sized rows once it is a sheet. */
	.sheet :global([role='option']) {
		padding-block: 0.75em;
	}

	.title {
		margin: 0.2em 0.45em 0.45em;
		font-family: var(--font-mono, monospace);
		font-size: 0.68em;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--dim, #888);
	}
</style>
