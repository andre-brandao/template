<script lang="ts">
	import type { Snippet } from 'svelte';
	import IconButton from '../input/IconButton.svelte';
	import * as Menu from '../menu';
	import Status, { type State } from '../status/Status.svelte';

	let {
		title,
		href,
		external = false,
		label,
		state = 'idle',
		message,
		muted = false,
		lead,
		meta,
		actions,
		menu,
		children
	}: {
		/** A snippet when the title is a control of its own, like a rename field. */
		title: string | Snippet;
		/** Stretched over the row, so anywhere outside its controls opens it. */
		href?: string;
		/** Opens `href` in a new tab, for a file or another site. */
		external?: boolean;
		/** Names the ⋯ menu; defaults to "{title} actions". */
		label?: string;
		/** A save or delete in flight, shown as a dot after the title. */
		state?: State;
		message?: string;
		/** Dimmed and inert, for a row being deleted. */
		muted?: boolean;
		/** Before the title: an avatar or an icon. */
		lead?: Snippet;
		/** Right-aligned facts: a size, a date. Hidden on narrow screens. */
		meta?: Snippet;
		/** Always-visible controls before the ⋯ menu. */
		actions?: Snippet;
		/** `Menu.Item`s, behind a ⋯ that shows on hover or focus. */
		menu?: Snippet;
		/** A second line under the title. */
		children?: Snippet;
	} = $props();

	const name = $derived(label ?? (typeof title === 'string' ? `${title} actions` : 'Actions'));
	// Held, not reactive: only the right-click handler reads it. (`state` is a prop here.)
	const ref: { menu?: Menu.Root } = {};
</script>

{#snippet text()}
	{#if typeof title === 'string'}{title}{:else}{@render title()}{/if}
{/snippet}

<!-- Right-click (or Shift+F10 inside the row) opens the same ⋯ menu at the pointer. -->
<li
	class={['row', { muted }]}
	aria-busy={muted || state === 'pending'}
	data-row
	oncontextmenu={(e) => ref.menu?.at(e)}
>
	{#if lead}<span class="lead">{@render lead()}</span>{/if}

	<div class="main">
		<span class="title">
			{#if href}
				<a
					class="link"
					{href}
					target={external ? '_blank' : undefined}
					rel={external ? 'noopener' : undefined}
					data-target>{@render text()}</a
				>
			{:else}
				<!-- A control title is not clipped, so its border and focus ring show. -->
				<span class={typeof title === 'string' ? 'text' : 'control'}>{@render text()}</span>
			{/if}
			{#if state !== 'idle'}<Status {state} {message} />{/if}
		</span>
		{#if children}<div class="sub">{@render children()}</div>{/if}
	</div>

	{#if meta}<span class="meta">{@render meta()}</span>{/if}
	{#if actions}<span class="actions">{@render actions()}</span>{/if}

	{#if menu}
		<Menu.Root bind:this={ref.menu} label={name} align="end">
			{#snippet trigger(attrs)}
				<span class="more">
					<IconButton label={name} size="sm" {...attrs}>
						<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<circle cx="5" cy="12" r="1.6" />
							<circle cx="12" cy="12" r="1.6" />
							<circle cx="19" cy="12" r="1.6" />
						</svg>
					</IconButton>
				</span>
			{/snippet}
			{@render menu()}
		</Menu.Root>
	{/if}
</li>

<style>
	.row {
		position: relative;
		display: flex;
		align-items: center;
		gap: 0.75em;
		min-height: 3em;
		padding: 0.35em 0.4em 0.35em 0.7em;
		border-bottom: 1px solid var(--border, #e6e5e1);
		transition:
			background 140ms ease,
			opacity 140ms ease;
	}

	.row:last-child {
		border-bottom-color: transparent;
	}

	.row:hover,
	.row:focus-within,
	.row:has(:global([aria-expanded='true'])) {
		background: var(--hover, rgb(0 0 0 / 0.06));
	}

	.muted {
		opacity: 0.55;
		pointer-events: none;
	}

	.lead {
		display: flex;
		flex: none;
	}

	.main {
		flex: 1;
		min-width: 0;
	}

	.title {
		display: flex;
		align-items: center;
		gap: 0.5em;
		min-width: 0;
	}

	.link,
	.text {
		min-width: 0;
		overflow: hidden;
		color: var(--ink, #1c1b19);
		font-weight: 500;
		text-decoration: none;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.control {
		flex: 1;
		min-width: 0;
		font-weight: 500;
	}

	.link {
		outline: none;
	}

	.link::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: var(--radius-sm, 6px);
	}

	.link:focus-visible::after {
		outline: 2px solid var(--accent, #2f7f68);
		outline-offset: -2px;
	}

	.sub {
		margin-top: 0.1em;
		overflow: hidden;
		color: var(--muted, #64625d);
		font-size: 0.85em;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta,
	.actions {
		display: flex;
		flex: none;
		align-items: center;
		gap: 1em;
	}

	.meta {
		color: var(--dim, #75736d);
		font-size: 0.82em;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	/* Controls sit above the stretched link, so they stay clickable. */
	.actions,
	.more {
		position: relative;
		z-index: 1;
	}

	/* Always holds its slot, so rows line up whether or not it is showing. */
	.more {
		display: flex;
		flex: none;
		opacity: 0;
		transition: opacity 140ms ease;
	}

	.row:hover .more,
	.row:focus-within .more,
	.more:has(:global([aria-expanded='true'])) {
		opacity: 1;
	}

	svg {
		width: 1.1em;
		height: 1.1em;
	}

	@media (hover: none) {
		.more {
			opacity: 1;
		}
	}

	@media (max-width: 600px) {
		.meta {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.row,
		.more {
			transition: none;
		}
	}
</style>
