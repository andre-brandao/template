<script lang="ts">
	import Self from './Schema.svelte';
	import type { doc } from './api.remote';

	type Node = Awaited<ReturnType<typeof doc>>['list'][number]['fields'][number];

	// `depth` only decides whether nested objects start open — one level unrolled is enough context.
	let { fields, depth = 0 }: { fields: Node[]; depth?: number } = $props();
</script>

<ul>
	{#each fields as one (one.name)}
		<li>
			<div class="row">
				<span class="name">{one.name}{one.required ? '*' : ''}</span>
				<span class="type">{one.type}{one.nullable ? ' | null' : ''}</span>
				{#if one.note}<span class="note">{one.note}</span>{/if}
				{#if one.example}<span class="eg">e.g. {one.example}</span>{/if}
			</div>
			{#if one.options}
				<p class="options">{one.options.join(' | ')}</p>
			{/if}
			{#if one.description}
				<p class="desc">{one.description}</p>
			{/if}
			{#if one.children.length}
				<details open={depth === 0}>
					<summary>{one.children.length} fields</summary>
					<Self fields={one.children} depth={depth + 1} />
				</details>
			{/if}
		</li>
	{/each}
</ul>

<style>
	ul {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		padding: 0.4em 0;
		border-top: 1px solid var(--border);
	}

	li:first-child {
		border-top: none;
	}

	.row {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.6em;
		font-family: var(--font-mono);
		font-size: 0.78em;
	}

	.name {
		color: var(--ink);
	}

	.type {
		color: var(--accent);
	}

	.note,
	.eg {
		color: var(--dim);
	}

	.desc,
	.options {
		margin: 0.15em 0 0;
		max-width: 70ch;
		color: var(--muted);
		font-size: 0.78em;
		/* Descriptions carry their own newlines, and they are meaningful. */
		white-space: pre-line;
	}

	.options {
		font-family: var(--font-mono);
		color: var(--dim);
	}

	details {
		margin-top: 0.3em;
		padding-left: 1em;
		border-left: 1px solid var(--border);
	}

	summary {
		cursor: pointer;
		color: var(--dim);
		font-size: 0.75em;
	}
</style>
