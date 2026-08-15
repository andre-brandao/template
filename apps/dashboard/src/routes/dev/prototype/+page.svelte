<script lang="ts">
	import { resolve } from '$app/paths';
	import { Card } from '@template/ui';

	let { data } = $props();
</script>

<div class="intro">
	<h1>Prototypes</h1>
	<p>
		Everything under <code>docs/prototype/</code>, rendered with its mockups live in their iframes.
		The same docs are served standalone by <code>bun prototype</code> on port 4400.
	</p>
</div>

{#if data.features.length}
	<div class="grid">
		{#each data.features as one (one.name)}
			<Card href={resolve('/dev/prototype/[feature]', { feature: one.name })} interactive>
				<h2>{one.title}</h2>
				{#if one.description}<p>{one.description}</p>{/if}
				<footer>
					<code>{one.name}</code>
					{#if one.status}<span class="badge">{one.status}</span>{/if}
				</footer>
			</Card>
		{/each}
	</div>
{:else}
	<p class="hint">
		Nothing in <code>docs/prototype/</code> yet — run the <code>prototype</code> skill to scaffold
		one.
	</p>
{/if}

<style>
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(19em, 1fr));
		gap: 1em;
	}

	h2 {
		margin: 0 0 0.4em;
		font-size: 1em;
	}

	.grid p {
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

	.badge {
		padding: 0.1em 0.55em;
		border: 1px solid var(--border);
		border-radius: 999px;
		color: var(--dim);
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
</style>
