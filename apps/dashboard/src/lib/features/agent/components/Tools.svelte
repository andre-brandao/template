<!-- What the orchestrator can call, by where it comes from: this page, the app, and the MCP as you. -->
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Badge, Empty, Input, Issue, List } from '@template/ui';
	import { tools } from '../api/agent.query';
	import { entry, type Source } from '../api/tools';
	import { agent } from '../agent.svelte';

	const ctx = agent();
	const list = createQuery(() => tools());
	const page = $derived(ctx.tools.map((tool) => entry('page', tool)));
	let search = $state('');

	const groups: { source: Source; title: string }[] = [
		{ source: 'page', title: 'Page' },
		{ source: 'app', title: 'App' },
		{ source: 'mcp', title: 'MCP' }
	];

	const shown = $derived.by(() => {
		const term = search.trim().toLowerCase();
		return [...page, ...(list.data?.tools ?? [])].filter(
			(tool) =>
				!term ||
				tool.name.toLowerCase().includes(term) ||
				tool.description.toLowerCase().includes(term)
		);
	});

	// The page group is the browser's own; the others wait on the server and can fail apart.
	const pending = (source: Source) => source !== 'page' && list.isPending;
	const failure = (source: Source) =>
		source === 'page' ? undefined : (list.error?.message ?? list.data?.errors[source]);
</script>

{#snippet row(tool: (typeof shown)[number])}
	<List.Row title={tool.name}>
		<div class="body">
			{#if tool.description}<p title={tool.description}>{tool.description}</p>{/if}
			<ul class="params">
				{#each tool.params as param (param.name)}
					<li>
						<code>{param.name}</code>
						<span class="type">{param.type}</span>
						{#if param.required}<Badge>required</Badge>{/if}
						{#if param.description}<span class="note">{param.description}</span>{/if}
					</li>
				{/each}
			</ul>
		</div>
	</List.Row>
{/snippet}

<div class="tools">
	<Input type="search" placeholder="Filter tools…" aria-label="Filter tools" bind:value={search} />
	{#each groups as group (group.source)}
		{@const rows = shown.filter((tool) => tool.source === group.source)}
		<section>
			<h3>{group.title}{#if rows.length}<small>{rows.length}</small>{/if}</h3>
			{#if pending(group.source)}
				<List.Loading rows={2} />
			{:else if failure(group.source)}
				<Issue retry={() => list.refetch()}>{failure(group.source)}</Issue>
			{:else if !rows.length}
				<Empty>{search.trim() ? 'No match.' : 'None for you here.'}</Empty>
			{:else}
				<List.Root label="{group.title} tools">
					{#each rows as tool (tool.name)}{@render row(tool)}{/each}
				</List.Root>
			{/if}
		</section>
	{/each}
</div>

<style>
	.tools {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1em;
		padding: 0.75em;
	}

	section {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.35em;
	}

	h3 {
		display: flex;
		align-items: baseline;
		gap: 0.5em;
		margin: 0;
		padding-inline: 0.6em;
		color: var(--muted);
		font-size: 0.75em;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	h3 small {
		font-weight: 400;
	}

	/* The row's second line is one clipped line; a tool needs a block. */
	.body {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.35em;
		padding-bottom: 0.2em;
		white-space: normal;
	}

	p {
		display: -webkit-box;
		margin: 0;
		overflow: hidden;
		line-clamp: 3;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		line-height: 1.4;
	}

	.params {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.2em;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.params:empty {
		display: none;
	}

	.params li {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.2em 0.5em;
	}

	code {
		color: var(--ink);
		font-family: var(--font-mono);
	}

	.type {
		overflow: hidden;
		max-width: 100%;
		font-family: var(--font-mono);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.note {
		flex-basis: 100%;
		padding-left: 0.75em;
	}
</style>
