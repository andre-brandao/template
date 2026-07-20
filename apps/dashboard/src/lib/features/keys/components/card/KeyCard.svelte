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

	const soon = $derived(
		!!key.expiresAt && new Date(key.expiresAt).getTime() - Date.now() < 7 * 86_400_000
	);
	const rail = $derived(!key.timeUsed ? 'var(--dim)' : soon ? 'var(--progress)' : 'var(--accent)');

	const copy = () => secret && navigator.clipboard.writeText(secret);
</script>

<li style:--rail={rail}>
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
</li>

<style>
	li {
		position: relative;
		display: flex;
		align-items: center;
		gap: 1em;
		flex-wrap: wrap;
		padding: 0.8em 1em 0.8em calc(1em - 2px);
		border: 1px solid var(--border);
		border-left: 3px solid var(--rail);
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: var(--shadow-1);
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease,
			transform 0.15s ease;
	}

	li:hover {
		border-top-color: var(--border-bright);
		border-right-color: var(--border-bright);
		border-bottom-color: var(--border-bright);
		box-shadow: var(--shadow-2);
		transform: translateY(-1px);
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
