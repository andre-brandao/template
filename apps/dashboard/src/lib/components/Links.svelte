<script lang="ts">
	import Issues from '$lib/components/Issues.svelte';
	import { resets } from '$lib/utils/form';
	import type { RemoteForm } from '@sveltejs/kit';
	import { Button, Input } from '@template/ui';
	import type { Link } from '@template/core/util/meta';
	import { label } from '$lib/utils/link';
	import X from '@lucide/svelte/icons/x';

	// The forms differ per slice (todo vs project), so they come in; the fields don't.
	type Add = Omit<RemoteForm<{ id: string; url: string; title?: string }, unknown>, 'for'>;
	type Drop = Omit<RemoteForm<{ id: string; url: string }, unknown>, 'for'>;

	let {
		id,
		links,
		add,
		drop,
		onsaved
	}: {
		id: string;
		links: Link[];
		add: Add;
		drop: (url: string) => Drop;
		onsaved: () => Promise<unknown>;
	} = $props();
</script>

{#if links.length}
	<ul>
		{#each links as link (link.url)}
			{@const form = drop(link.url)}
			<li>
				<a href={link.url} target="_blank" rel="noopener noreferrer" title={link.url}>
					{label(link)}
				</a>
				<form
					{...form.enhance(async (f) => {
						await f.submit();
						await onsaved();
					})}
				>
					<input {...form.fields.id.as('hidden', id)} />
					<input {...form.fields.url.as('hidden', link.url)} />
					<button type="submit" aria-label="Remove {label(link)}" disabled={!!form.pending}>
						<X size={14} strokeWidth={1.75} />
					</button>
				</form>
			</li>
		{/each}
	</ul>
{/if}

<Issues issues={add.fields.allIssues()} />

<form
	class="add"
	{...add.enhance(resets(onsaved))}
>
	<input {...add.fields.id.as('hidden', id)} />
	<Input placeholder="https://…" {...add.fields.url.as('url')} />
	<Input placeholder="Title (optional)" {...add.fields.title.as('text')} />
	<Button type="submit" variant="secondary" pending={!!add.pending}>Add link</Button>
</form>

<style>
	/* Rows split by hairlines, like the rest of a minimal list. */
	ul {
		list-style: none;
		margin: 0 0 0.75em;
		padding: 0;
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.5em;
		min-height: 2.25em;
		border-bottom: 1px solid var(--border);
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

	li form {
		display: contents;
	}

	li button {
		display: inline-flex;
		padding: 0.3em;
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--dim);
		cursor: pointer;
	}

	li button:hover {
		background: var(--hover);
		color: var(--danger);
	}

	.add {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.5em;
	}
</style>
