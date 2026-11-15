<script lang="ts">
	import { Status, modal } from '@template/ui';
	import type { Link } from '@template/core/util/meta';
	import { message } from '#lib/query.ts';
	import { label } from '#lib/utils/link.ts';
	import LinkForm from './LinkForm.svelte';
	import X from '@lucide/svelte/icons/x';
	import Plus from '@lucide/svelte/icons/plus';

	// The writes differ per slice (todo vs project), so they come in; the fields don't.
	let {
		links,
		add,
		drop
	}: {
		links: Link[];
		add: (link: { url: string; title?: string }) => Promise<unknown>;
		drop: (url: string) => Promise<unknown>;
	} = $props();

	// Per url: a removal in flight, or the reason it failed. A success drops the row itself.
	let marks = $state<Record<string, { state: 'pending' | 'failed'; message?: string }>>({});

	function remove(url: string) {
		marks[url] = { state: 'pending' };
		drop(url).then(
			() => delete marks[url],
			(err) => (marks[url] = { state: 'failed', message: message(err) })
		);
	}
</script>

{#if links.length}
	<ul>
		{#each links as link (link.url)}
			{@const mark = marks[link.url]}
			<li class={{ pending: mark?.state === 'pending' }}>
				<a href={link.url} target="_blank" rel="noopener noreferrer" title={link.url}>
					{label(link)}
				</a>
				{#if mark}<Status state={mark.state} message={mark.message} />{/if}
				<button
					type="button"
					aria-label="Remove {label(link)}"
					disabled={mark?.state === 'pending'}
					onclick={() => remove(link.url)}
				>
					<X size={14} strokeWidth={1.75} />
				</button>
			</li>
		{/each}
	</ul>
{/if}

<button type="button" class="add" onclick={() => modal(LinkForm, { add })}>
	<Plus size={14} strokeWidth={1.75} />
	Add link
</button>

<style>
	ul {
		list-style: none;
		margin: 0 0 0.35em;
		padding: 0;
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.5em;
		min-height: 2.25em;
		border-bottom: 1px solid var(--border);
		transition: opacity 140ms ease;
	}

	li.pending {
		opacity: 0.55;
	}

	li a {
		flex: 1;
		min-width: 0;
		color: var(--ink);
		text-decoration: none;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	li a:hover {
		color: var(--accent);
		text-decoration: underline;
	}

	button {
		display: inline-flex;
		align-items: center;
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--dim);
		font: inherit;
		cursor: pointer;
		transition:
			opacity 140ms ease,
			color 140ms ease,
			background 140ms ease;
	}

	button:hover {
		background: var(--hover);
	}

	button:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -1px;
	}

	/* Hidden until the row is hovered or focused; opacity keeps the row from reflowing. */
	li button {
		padding: 0.3em;
		opacity: 0;
	}

	li:hover button,
	li:focus-within button {
		opacity: 1;
	}

	li button:hover {
		color: var(--danger);
	}

	.add {
		gap: 0.35em;
		padding: 0.3em 0.45em;
		margin-left: -0.45em;
		font-size: 0.86em;
	}

	.add:hover {
		color: var(--ink);
	}

	@media (hover: none) {
		li button {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		button {
			transition: none;
		}
	}
</style>
