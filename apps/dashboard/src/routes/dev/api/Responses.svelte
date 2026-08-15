<script lang="ts">
	import { Code } from '@template/ui';
	import Schema from './Schema.svelte';
	import Status from './Status.svelte';
	import type { doc } from './api.remote';

	type Res = Awaited<ReturnType<typeof doc>>['list'][number]['responses'][number];

	let { responses }: { responses: Res[] } = $props();
</script>

{#if responses.length}
	<section>
		<h2>Responses</h2>
		{#each responses as one (one.status)}
			<details open={one.status < 300}>
				<summary>
					<Status status={one.status} />
					<span class="desc">{one.description}</span>
					<!-- Only when it names a component: `object` beside the description is noise. -->
					{#if one.ref}<span class="type">{one.type}</span>{/if}
				</summary>
				<div class="body">
					<Schema fields={one.fields} />
					{#if one.example}
						<Code value={one.example} lang="json" title="example" />
					{/if}
				</div>
			</details>
		{/each}
	</section>
{/if}

<style>
	section {
		margin-top: 2em;
	}

	h2 {
		margin: 0 0 0.6em;
		font-size: 0.8em;
		font-weight: 500;
		color: var(--muted);
	}

	details {
		border-top: 1px solid var(--border);
	}

	details:last-child {
		border-bottom: 1px solid var(--border);
	}

	summary {
		display: flex;
		align-items: center;
		gap: 0.6em;
		padding: 0.5em 0;
		cursor: pointer;
		font-size: 0.78em;
	}

	.desc {
		color: var(--ink);
	}

	.type {
		font-family: var(--font-mono);
		color: var(--accent);
	}

	.body {
		padding: 0 0 0.8em 0.5em;
	}

	.body :global(pre.tm-code) {
		max-height: 20em;
		overflow: auto;
		padding: 0.9em 1em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		font-size: 0.75em;
		line-height: 1.5;
	}
</style>
