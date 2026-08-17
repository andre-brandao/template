<script lang="ts">
	import type { Key } from '@template/core/key';
	import { Card } from '@template/ui';
	import RevokeForm from '../RevokeForm.svelte';
	import { fmt } from '$lib/utils/fmt';

	let { key }: { key: Key.Info } = $props();

	const f = fmt();

	// The mask is all there is: the row keeps a hash, so nothing here can be revealed.
	const used = $derived(key.timeUsed ? `last used ${f.date(key.timeUsed)}` : 'never used');
	const expires = $derived(key.expiresAt ? `expires ${f.date(key.expiresAt)}` : 'never expires');

	const soon = $derived(
		!!key.expiresAt && new Date(key.expiresAt).getTime() - Date.now() < 7 * 86_400_000
	);
	const rail = $derived(!key.timeUsed ? 'var(--dim)' : soon ? 'var(--progress)' : 'var(--accent)');
</script>

<Card as="li" accent={rail} interactive dense>
	<div class="row">
		<div class="meta">
			<span class="name">{key.name}</span>
			<span class="used">{used} · {expires}</span>
		</div>

		<div class="secret">
			<code>{key.display}</code>
		</div>

		<div class="actions">
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
	}

	.actions {
		display: flex;
		align-items: center;
		gap: 0.4em;
		margin-left: auto;
	}
</style>
