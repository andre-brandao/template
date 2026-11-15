<script lang="ts">
	import { Button, Input, Issue } from '@template/ui';
	import type { Link } from '@template/core/util/meta';
	import { label } from '$lib/utils/link';
	import X from '@lucide/svelte/icons/x';

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

	let pending = $state(false);
	let error = $state<string>();

	// A remote command rejects with `{ body: { message } }`, the query SDK with the body itself.
	function run(job: Promise<unknown>) {
		pending = true;
		error = undefined;
		return job
			.then(
				() => true,
				(err: { message?: string; body?: { message?: string } }) => {
					error = err.body?.message ?? err.message ?? 'Could not save the link';
					return false;
				}
			)
			.finally(() => (pending = false));
	}

	async function submit(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
		e.preventDefault();
		const form = e.currentTarget;
		const data = new FormData(form);
		const title = String(data.get('title') ?? '').trim();
		if (await run(add({ url: String(data.get('url')), title: title || undefined }))) form.reset();
	}
</script>

{#if links.length}
	<ul>
		{#each links as link (link.url)}
			<li>
				<a href={link.url} target="_blank" rel="noopener noreferrer" title={link.url}>
					{label(link)}
				</a>
				<button
					type="button"
					aria-label="Remove {label(link)}"
					disabled={pending}
					onclick={() => run(drop(link.url))}
				>
					<X size={14} strokeWidth={1.75} />
				</button>
			</li>
		{/each}
	</ul>
{/if}

{#if error}<Issue>{error}</Issue>{/if}

<form class="add" onsubmit={submit}>
	<Input type="url" name="url" placeholder="https://…" required />
	<Input name="title" placeholder="Title (optional)" maxlength={200} />
	<Button type="submit" variant="secondary" {pending}>Add link</Button>
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
