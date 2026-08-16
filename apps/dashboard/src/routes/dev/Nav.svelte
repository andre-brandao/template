<script
	lang="ts"
	generics="T extends { href: string; label: string; group?: string; active?: boolean }"
>
	import type { Snippet } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import Chevron from '@lucide/svelte/icons/chevron-down';

	let {
		label,
		items,
		tall = false,
		head,
		row,
		children
	}: {
		/** Names the list for screen readers, and stands in when nothing is selected. */
		label: string;
		items: T[];
		/** Fill the shell's height and scroll the list inside it, rather than the page. */
		tall?: boolean;
		head?: Snippet;
		row?: Snippet<[T]>;
		children: Snippet;
	} = $props();

	const groups = $derived([...new Set(items.map((one) => one.group ?? ''))]);
	const active = $derived(items.find((one) => one.active));
	// Below this the list collapses to a dropdown showing only where you are.
	const narrow = new MediaQuery('max-width: 900px');
	let open = $state(false);
</script>

{#snippet face(one: T)}
	{#if row}{@render row(one)}{:else}{one.label}{/if}
{/snippet}

{#snippet list()}
	{#each groups as group (group)}
		{#if group}<h2>{group}</h2>{/if}
		{#each items.filter((one) => (one.group ?? '') === group) as one (one.href)}
			<a
				class="navlink"
				href={one.href}
				aria-current={one.active ? 'page' : undefined}
				data-transition="pane"
				onclick={() => (open = false)}>{@render face(one)}</a
			>
		{/each}
	{/each}
{/snippet}

<div class="split" class:tall>
	<div class="side">
		{#if head}{@render head()}{/if}
		<nav aria-label={label}>
			{#if narrow.current}
				<details bind:open>
					<summary>
						<span class="face">{#if active}{@render face(active)}{:else}{label}{/if}</span>
						<span class="chevron"><Chevron size={14} /></span>
					</summary>
					<div class="menu">{@render list()}</div>
				</details>
			{:else}
				{@render list()}
			{/if}
		</nav>
	</div>
	<div class="pane">{@render children()}</div>
</div>

<style>
	.split {
		display: flex;
		align-items: flex-start;
		gap: 2em;
	}

	.split.tall {
		align-items: stretch;
		height: var(--fill);
		min-height: 26em;
	}

	.side {
		display: flex;
		flex-direction: column;
		gap: 0.6em;
		width: 15em;
		flex-shrink: 0;
		position: sticky;
		top: calc(var(--topbar) + 1.75em);
	}

	.tall .side {
		position: static;
		min-height: 0;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		min-height: 0;
	}

	.tall nav {
		overflow-y: auto;
		scrollbar-gutter: stable;
	}

	h2 {
		margin: 1.2em 0 0.3em;
		padding-left: 0.7em;
		font-family: var(--font-mono);
		font-size: 0.65em;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--dim);
	}

	h2:first-child {
		margin-top: 0;
	}

	.navlink {
		display: flex;
		align-items: center;
		gap: 0.5em;
		padding: 0.4em 0.7em;
		border-radius: var(--radius);
		overflow: hidden;
		color: var(--muted);
		font-size: 0.8em;
		text-decoration: none;
	}

	.navlink:hover,
	.navlink[aria-current='page'] {
		color: var(--ink);
		background: var(--surface-2);
	}

	summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
		padding: 0.5em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		font-size: 0.8em;
		cursor: pointer;
		list-style: none;
	}

	summary::-webkit-details-marker {
		display: none;
	}

	.face {
		display: flex;
		align-items: center;
		gap: 0.5em;
		min-width: 0;
		overflow: hidden;
	}

	.chevron {
		display: flex;
		color: var(--dim);
		transition: transform 0.15s;
	}

	details[open] .chevron {
		transform: rotate(180deg);
	}

	.menu {
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		position: absolute;
		z-index: 5;
		left: 0;
		right: 0;
		margin-top: 0.3em;
		padding: 0.4em;
		max-height: 60vh;
		overflow-y: auto;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: 0 8px 24px rgb(0 0 0 / 0.25);
	}

	.pane {
		flex: 1;
		min-width: 0;
	}

	.tall .pane {
		min-height: 0;
	}

	@media (max-width: 900px) {
		.split,
		.split.tall {
			flex-direction: column;
			align-items: stretch;
			height: auto;
		}

		.side {
			width: 100%;
			position: static;
		}

		nav,
		.tall nav {
			position: relative;
			/* The dropdown hangs outside the list, which tall mode otherwise scrolls. */
			overflow: visible;
		}
	}

	/* Sibling screens share this list, so only the pane should move. Gated on the scope the
	   list's own links declare — ungated, the list would vanish when leaving /dev entirely. */
	:global(html[data-scope='pane']) .pane {
		view-transition-name: pane;
	}

	:global(::view-transition-old(pane)),
	:global(::view-transition-new(pane)) {
		animation-duration: 200ms;
		animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
		animation-fill-mode: both;
		mix-blend-mode: normal;
	}

	:global(::view-transition-old(pane)) {
		animation-name: out;
	}

	:global(::view-transition-new(pane)) {
		animation-name: in;
	}

	@keyframes out {
		to {
			opacity: 0;
		}
	}

	@keyframes in {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		:global(::view-transition-old(pane)),
		:global(::view-transition-new(pane)) {
			animation: none;
		}
	}
</style>
