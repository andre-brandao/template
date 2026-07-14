<script lang="ts">
	import type { Key } from '@template/core/key';
	import { Button } from '@template/ui';
	import { removeKey } from '../../api/keys.remote';

	let { key }: { key: Key.Info } = $props();

	const revoke = $derived(removeKey.for(key.id));

	// Non-null for `api` keys, which is all this card is ever given.
	const secret = $derived(key.key);

	let shown = $state(false);

	const used = $derived(
		key.timeUsed ? `last used ${new Date(key.timeUsed).toLocaleDateString()}` : 'never used'
	);
</script>

<li>
	{#each revoke.fields.allIssues() ?? [] as issue}
		<p class="error">{issue.message}</p>
	{/each}

	<div class="meta">
		<span class="name">{key.name}</span>
		<span class="used">{used}</span>
	</div>

	<code class:revealed={shown}>{shown && secret ? secret : key.display}</code>

	<div class="actions">
		{#if secret}
			<Button onclick={() => (shown = !shown)}>{shown ? 'Hide' : 'Reveal'}</Button>
			<Button onclick={() => navigator.clipboard.writeText(secret)}>Copy</Button>
		{/if}
		<form {...revoke}>
			<input {...revoke.fields.id.as('hidden', key.id)} />
			<Button variant="danger" type="submit" pending={!!revoke.pending}>Revoke</Button>
		</form>
	</div>
</li>

<style>
	li {
		display: flex;
		align-items: center;
		gap: 1em;
		flex-wrap: wrap;
		padding: 0.8em 1em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}

	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		min-width: 10em;
	}

	.name {
		font-weight: 600;
	}

	.used {
		font-size: 0.78em;
		color: var(--dim);
	}

	code {
		flex: 1;
		font-family: var(--font-mono);
		font-size: 0.82em;
		color: var(--muted);
		overflow-wrap: anywhere;
	}

	code.revealed {
		color: var(--ink);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.4em;
		margin-left: auto;
	}

	.error {
		flex-basis: 100%;
		margin: 0 0 0.4em;
		color: var(--danger, crimson);
	}
</style>
