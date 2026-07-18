<script lang="ts">
	import type { Key } from '@template/core/key';
	import { Button } from '@template/ui';
	import RevokeForm from '../RevokeForm.svelte';

	let { key }: { key: Key.Info } = $props();

	let shown = $state(false);

	// Non-null for `api` keys, which is all this card is ever given.
	const secret = $derived(key.key);
	const text = $derived(shown && secret ? secret : key.display);
	const toggle = $derived(shown ? 'Hide' : 'Reveal');
	const used = $derived(
		key.timeUsed ? `last used ${new Date(key.timeUsed).toLocaleDateString()}` : 'never used'
	);
	const expires = $derived(
		key.expiresAt ? `expires ${new Date(key.expiresAt).toLocaleDateString()}` : 'never expires'
	);

	const copy = () => secret && navigator.clipboard.writeText(secret);
</script>

<li>
	<div class="meta">
		<span class="name">{key.name}</span>
		<span class="used">{used} · {expires}</span>
	</div>

	<code class:revealed={shown}>{text}</code>

	<div class="actions">
		{#if secret}
			<Button onclick={() => (shown = !shown)}>{toggle}</Button>
			<Button onclick={copy}>Copy</Button>
		{/if}
		<RevokeForm id={key.id} />
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
</style>
