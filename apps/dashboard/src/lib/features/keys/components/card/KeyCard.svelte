<script lang="ts">
	import type { Key } from '@template/core/key';
	import { Button, Card } from '@template/ui';
	import RevokeForm from '../RevokeForm.svelte';
	import { fmt } from '$lib/utils/fmt';

	let { key }: { key: Key.Info } = $props();

	const f = fmt();
	let shown = $state(false);

	// Non-null for `api` keys, which is all this card is ever given.
	const secret = $derived(key.key);
	const text = $derived(shown && secret ? secret : key.display);
	const toggle = $derived(shown ? 'Hide' : 'Reveal');
	const used = $derived(key.timeUsed ? `last used ${f.date(key.timeUsed)}` : 'never used');
	const expires = $derived(key.expiresAt ? `expires ${f.date(key.expiresAt)}` : 'never expires');

	const soon = $derived(
		!!key.expiresAt && new Date(key.expiresAt).getTime() - Date.now() < 7 * 86_400_000
	);
	const rail = $derived(!key.timeUsed ? 'var(--dim)' : soon ? 'var(--progress)' : 'var(--accent)');

	const copy = () => secret && navigator.clipboard.writeText(secret);
</script>

<Card as="li" accent={rail} interactive dense>
	<div class="row">
		<div class="meta">
			<span class="name">{key.name}</span>
			<span class="used">{used} · {expires}</span>
		</div>

		<div class="secret" class:revealed={shown}>
			<code>{text}</code>
		</div>

		<div class="actions">
			{#if secret}
				<Button onclick={() => (shown = !shown)}>{toggle}</Button>
				<Button onclick={copy}>Copy</Button>
			{/if}
			<RevokeForm id={key.id} />
		</div>
	</div>
</Card>

<style>
	.row {
		display: flex;
		align-items: center;
		gap: 1em;
		flex-wrap: wrap;
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

	.secret {
		flex: 1;
		min-width: 12em;
		padding: 0.45em 0.65em;
		border-radius: calc(var(--radius) - 2px);
		background: var(--bg);
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.45);
	}

	.secret code {
		font-family: var(--font-mono);
		font-size: 0.82em;
		color: var(--muted);
		overflow-wrap: anywhere;
		transition: color 0.2s ease;
	}

	.secret.revealed code {
		color: var(--ink);
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.4em;
		margin-left: auto;
	}
</style>
