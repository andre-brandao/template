<script lang="ts">
	import { resolve } from '$app/paths';
	import { Badge, Card, Empty } from '@template/ui';
	import * as Header from '#lib/components/header/index.ts';

	let { data } = $props();
</script>

<Header.Root title="Prototypes">
	{#snippet lead()}
		Everything under <code>docs/prototype/</code>, with its mockups live in their iframes. Also
		served standalone by <code>bun prototype</code> on port 4400.
	{/snippet}
</Header.Root>

{#if data.features.length}
	<div class="grid">
		{#each data.features as one (one.name)}
			<Card href={resolve('/dev/prototype/[feature]', { feature: one.name })} interactive>
				<h2>{one.title}</h2>
				{#if one.description}<p>{one.description}</p>{/if}
				<footer>
					<code>{one.name}</code>
					{#if one.status}<Badge>{one.status}</Badge>{/if}
				</footer>
			</Card>
		{/each}
	</div>
{:else}
	<Empty>Nothing in docs/prototype/ yet. Run the prototype skill to scaffold one.</Empty>
{/if}

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(100%, 19em), 1fr));
		gap: 1em;
	}

	h2 {
		margin: 0 0 0.4em;
		font-size: 1em;
	}

	p {
		margin: 0;
		color: var(--muted);
		font-size: 0.85em;
	}

	footer {
		display: flex;
		align-items: center;
		gap: 0.6em;
		margin-top: 0.9em;
		font-size: 0.7em;
	}

	code {
		font-family: var(--font-mono);
		color: var(--dim);
	}
</style>
