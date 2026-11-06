<!--
	`Header.Root`: the page header. Row 1 is eyebrow, title, a one-line lead and actions. Under it,
	the facts band (children: `Header.Item`s) and the filter row (strip: `Header.Group`s). The
	shell's width follows its side panels, so breakpoints are container queries on the header.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		eyebrow,
		lead,
		actions,
		strip,
		children
	}: {
		title: string | Snippet;
		/** The parent record, above the title; a snippet is usually its link. */
		eyebrow?: string | Snippet;
		/** One short line under the title: what the page is for. */
		lead?: string | Snippet;
		actions?: Snippet;
		/** The filter row: `Header.Group`s of search, selects and toggles. */
		strip?: Snippet;
		/** The facts band: `Header.Item`s, most important first. */
		children?: Snippet;
	} = $props();

	// Marks each child that opens a flex line, so `Item` and `Group` drop their rule there;
	// CSS can't tell where a line wrapped.
	function band(node: HTMLElement) {
		const mark = () => {
			const shown = [...node.children].filter((child) => child.getClientRects().length) as HTMLElement[];
			shown.forEach((child, i) => {
				const prev = shown[i - 1];
				child.toggleAttribute('data-lead', !prev || child.offsetTop >= prev.offsetTop + prev.offsetHeight);
			});
		};
		const resize = new ResizeObserver(mark);
		const mutation = new MutationObserver(mark);
		resize.observe(node);
		mutation.observe(node, { childList: true });
		mark();
		return () => {
			resize.disconnect();
			mutation.disconnect();
		};
	}
</script>

{#snippet text(value: string | Snippet)}
	{#if typeof value === 'string'}{value}{:else}{@render value()}{/if}
{/snippet}

<header>
	<div class="main">
		<div class="body">
			{#if eyebrow}<p class="eyebrow">{@render text(eyebrow)}</p>{/if}
			<h1>{@render text(title)}</h1>
			{#if lead}<p class="lead">{@render text(lead)}</p>{/if}
		</div>
		{#if actions}<div class="actions">{@render actions()}</div>{/if}
	</div>

	{#if children}
		<div class="band facts" {@attach band}>{@render children()}</div>
	{/if}

	{#if strip}
		<div class="band strip" {@attach band}>{@render strip()}</div>
	{/if}
</header>

<style>
	/* Flat on the page: the title is the hierarchy, the bands under it toolbars split by
	   hairlines rather than a box around the lot. */
	header {
		container: header / inline-size;
		/* Containment makes a stacking context; without a level the body paints over dropdowns. */
		position: relative;
		z-index: 2;
		margin-bottom: 1.25em;
		view-transition-name: shell-header;
	}

	/* Held still across a navigation: the outgoing copy is dropped rather than cross-faded. */
	:global(::view-transition-old(shell-header)) {
		opacity: 0;
		animation: none;
	}

	:global(::view-transition-new(shell-header)) {
		animation: none;
		mix-blend-mode: normal;
	}

	.main {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75em 0.9em;
		padding-bottom: 1em;
	}

	.main:last-child {
		border-bottom: 1px solid var(--border);
	}

	.body {
		flex: 1;
		min-width: 0;
	}

	.eyebrow {
		margin: 0 0 0.2em;
		font-size: 0.93em;
		color: var(--muted);
	}

	.eyebrow :global(a) {
		color: var(--muted);
		text-decoration: none;
	}

	.eyebrow :global(a:hover) {
		color: var(--ink);
		text-decoration: underline;
	}

	h1 {
		margin: 0;
		font-size: 1.5em;
		line-height: 1.25;
		overflow-wrap: anywhere;
	}

	.lead {
		margin: 0.3em 0 0;
		max-width: 72ch;
		color: var(--muted);
	}

	.lead :global(code) {
		font-family: var(--font-mono);
		font-size: 0.9em;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		align-items: center;
		gap: 0.5em;
	}

	.band {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.6em 0;
		min-width: 0;
		padding: 0.6em 0;
		border-top: 1px solid var(--border);
		color: var(--muted);
	}

	.band:last-child {
		border-bottom: 1px solid var(--border);
	}

	.strip {
		/* The one control height on the row. */
		--control: 2rem;
		gap: 0.5em 0;
		color: inherit;
	}

	.strip :global(:is(select, input:not([type='checkbox'], [type='radio']), button)) {
		min-height: var(--control);
	}

	/* Sized for a form column elsewhere; here a select only needs its option words. */
	.strip :global(select) {
		width: auto;
		max-width: 100%;
	}

	.strip :global(input[type='search']) {
		flex: 1 1 16em;
		min-width: 8em;
		max-width: 28em;
	}

	/* `Input` sets `flex: 1`; on the row only search grows, the rest fits content. */
	.strip :global(input:not([type='search'], [type='checkbox'], [type='radio'])) {
		flex: none;
		width: auto;
	}

	@media print {
		.strip {
			display: none;
		}
	}

	@container header (max-width: 640px) {
		.facts {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
			align-items: start;
			gap: 0.75em 0;
		}
	}
</style>
