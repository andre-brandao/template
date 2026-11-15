<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import Copy from '@lucide/svelte/icons/copy';
	import { Dialog, IconButton, toast } from '@template/ui';

	// The only place a new secret exists: it lives in these props, never in a query.
	let { title, secret, close }: { title: string; secret: string; close: () => void } = $props();

	let copied = $state(false);

	const copy = () =>
		navigator.clipboard.writeText(secret).then(
			() => (copied = true),
			() => toast.error('Could not copy')
		);
</script>

<Dialog {title} {close}>
	<p>Copy it now: it won't be shown again.</p>
	<div class="secret">
		<code>{secret}</code>
		<IconButton label={copied ? 'Copied' : 'Copy secret'} size="sm" onclick={copy}>
			{#if copied}<Check size={15} />{:else}<Copy size={15} />{/if}
		</IconButton>
	</div>
</Dialog>

<style>
	p {
		margin: 0;
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
</style>
