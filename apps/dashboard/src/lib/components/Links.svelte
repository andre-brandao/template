<script lang="ts">
	import Issues from '$lib/components/Issues.svelte';
	import { resets } from '$lib/utils/form';
	import type { RemoteForm } from '@sveltejs/kit';
	import { Button, Input } from '@template/ui';
	import type { Link } from '@template/core/util/meta';
	import { label } from '$lib/utils/link';

	// The forms differ per slice (todo vs project), so they come in; the fields don't.
	type Add = Omit<RemoteForm<{ id: string; url: string; title?: string }, unknown>, 'for'>;
	type Drop = Omit<RemoteForm<{ id: string; url: string }, unknown>, 'for'>;

	let {
		id,
		links,
		add,
		drop,
		onsaved,
		heading
	}: {
		id: string;
		links: Link[];
		add: Add;
		drop: (url: string) => Drop;
		onsaved: () => Promise<unknown>;
		heading?: string;
	} = $props();
</script>

{#if heading}<h2>{heading}</h2>{/if}

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
						×
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
	h2 {
		margin: 0 0 0.6em;
		font-family: var(--font-mono);
		font-size: 0.68em;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--dim);
	}

	ul {
		list-style: none;
		margin: 0 0 0.75em;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.4em;
	}

	li {
		display: inline-flex;
		align-items: center;
		gap: 0.2em;
		max-width: 100%;
		border: 1px solid var(--border);
		background: var(--surface-2);
		border-radius: 999px;
		padding: 0.15em 0.3em 0.15em 0.65em;
		font-size: 0.8em;
	}

	li a {
		color: var(--ink);
		text-decoration: none;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	li a:hover {
		color: var(--accent);
	}

	li form {
		display: contents;
	}

	li button {
		border: 0;
		background: none;
		padding: 0 0.3em;
		color: var(--dim);
		cursor: pointer;
		font: inherit;
		line-height: 1;
	}

	li button:hover {
		color: var(--danger);
	}

	.add {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.5em;
	}
</style>
