<script lang="ts">
	import { page } from '$app/state';
	import { Button, Drawer, FormBoundary, Input, Issues } from '@template/ui';
	import { org } from '../context';
	import { createOrg } from '../api/org.remote';

	const ctx = org();

	let open = $state(false);
	let creating = $state(false);
	let root = $state<HTMLElement>();

	// Switching preserves the section you're in (/org_a/files → /org_b/files);
	// detail segments are dropped since the entity doesn't exist in the other org.
	const section = $derived.by(() => {
		if (!ctx.current || !page.url.pathname.startsWith(`/${ctx.current.id}/`)) return 'todos';
		return page.url.pathname.slice(ctx.current.id.length + 2).split('/')[0] || 'todos';
	});
</script>

<svelte:window
	onpointerdown={(e) => {
		if (open && root && !root.contains(e.target as Node)) open = false;
	}}
/>

{#if ctx.current}
	<details class="switcher" bind:open bind:this={root}>
		<summary class="trigger">
			{ctx.current.name}
			<span class="caret">▾</span>
		</summary>

		<div class="menu">
			{#each ctx.orgs as o (o.id)}
				<a
					href="/{o.id}/{section}"
					aria-current={o.id === ctx.current.id ? 'true' : undefined}
					onclick={() => (open = false)}
				>
					{o.name}
				</a>
			{/each}
			<button
				class="new"
				type="button"
				onclick={() => {
					open = false;
					creating = true;
				}}
			>
				+ New organization
			</button>
		</div>
	</details>

	<Drawer bind:open={creating}>
		<h2>New organization</h2>
		<FormBoundary>
			<Issues of={createOrg.fields.allIssues()} />

			<form
				class="add"
				{...createOrg.enhance(async (f) => {
					await f.submit();
				})}
			>
				<label class="field">
					<span>Name</span>
					<Input placeholder="e.g. acme" {...createOrg.fields.name.as('text')} />
				</label>
				<Button type="submit" pending={!!createOrg.pending}>Create</Button>
			</form>
		</FormBoundary>
	</Drawer>
{/if}

<style>
	.switcher {
		position: relative;
	}

	.trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		list-style: none;
		user-select: none;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: none;
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.82em;
		padding: 0.35em 0.7em;
		cursor: pointer;
	}

	.trigger:hover {
		color: var(--ink);
		background: var(--surface-2);
	}

	.trigger::-webkit-details-marker {
		display: none;
	}

	.caret {
		font-size: 0.8em;
		color: var(--dim);
	}

	.menu {
		position: absolute;
		top: calc(100% + 0.35em);
		left: 0;
		z-index: 10;
		min-width: 12em;
		display: flex;
		flex-direction: column;
		padding: 0.3em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: 0 4px 16px color-mix(in srgb, var(--ink) 10%, transparent);
	}

	.menu a,
	.menu .new {
		font-family: var(--font-mono);
		font-size: 0.82em;
		text-align: left;
		color: var(--muted);
		text-decoration: none;
		padding: 0.45em 0.6em;
		border-radius: var(--radius);
		border: none;
		background: none;
		cursor: pointer;
	}

	.menu a:hover,
	.menu .new:hover {
		color: var(--ink);
		background: var(--surface-2);
	}

	.menu a[aria-current='true'] {
		color: var(--ink);
		background: var(--surface-2);
	}

	.menu .new {
		border-top: 1px solid var(--border);
		border-radius: 0 0 var(--radius) var(--radius);
		margin-top: 0.3em;
		padding-top: 0.55em;
	}

	h2 {
		margin: 0 0 1em;
		font-size: 1.15em;
	}

	.add {
		display: flex;
		align-items: end;
		flex-wrap: wrap;
		gap: 0.6em;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 0.35em;
		flex: 1 1 12em;
	}

	.field span {
		font-family: var(--font-mono);
		font-size: 0.78em;
		color: var(--muted);
	}
</style>
