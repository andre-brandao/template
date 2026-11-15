<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import { Button, Tooltip } from '@template/ui';

	// The only place a new secret exists: it lives in these props, never in a query.
	let { title, secret, close }: { title: string; secret: string; close: () => void } = $props();

	let copied = $state(false);

	const copy = () => navigator.clipboard.writeText(secret).then(() => (copied = true));
</script>

<h2>{title}</h2>
<p>Copy it now: it won't be shown again.</p>

<div class="secret">
	<code>{secret}</code>
	<Tooltip tip={copied ? 'Copied' : 'Copy'}>
		<button type="button" class:copied aria-label="Copy secret" onclick={copy}>
			{#if copied}<Check size={15} />{:else}<Copy size={15} />{/if}
		</button>
	</Tooltip>
</div>

<div class="actions">
	<Button onclick={close}>Done</Button>
</div>

<style>
	h2 {
		margin: 0 0 0.4em;
		font-size: 1.05em;
	}

	p {
		margin: 0 0 1em;
		font-size: 0.85em;
		color: var(--muted);
	}

	.secret {
		display: flex;
		align-items: center;
		gap: 0.4em;
		padding: 0.45em 0.45em 0.45em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--bg);
	}

	code {
		flex: 1;
		min-width: 0;
		font-family: var(--font-mono);
		font-size: 0.82em;
		overflow-wrap: anywhere;
		user-select: all;
	}

	button {
		display: grid;
		place-items: center;
		padding: 0.35em;
		border: 0;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--muted);
		cursor: pointer;
		transition: color 140ms ease;
	}

	button:hover {
		color: var(--ink);
	}

	.copied {
		color: var(--done);
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 1.2em;
	}
</style>
