<script lang="ts">
	import { Button, Issue, modal } from '@template/ui';
	import { rotate } from '../../api/developers.query';

	let { id, held }: { id: string; held: boolean } = $props();

	// Local, not the mutation's data: a remount must not show the last secret again.
	let secret = $state('');

	const save = rotate({ onSuccess: (data) => (secret = data.secret) });

	const copy = () => navigator.clipboard.writeText(secret);

	async function run() {
		// Rotating breaks whatever is signing with the current secret, so ask first.
		if (held && !(await modal.confirm({ title: 'Rotate secret', action: 'Rotate secret', body: warn })))
			return;
		save.mutate({ path: { id } });
	}

	// Reset drops the secret the mutation still holds in its data.
	function close() {
		secret = '';
		save.reset();
	}
</script>

{#snippet warn()}
	The current secret stops working immediately.
{/snippet}

{#if save.error}
	<Issue>{save.error.message}</Issue>
{/if}

{#if secret}
	<div class="minted">
		<p>Copy it now — it is never shown again. Rotating replaces it at once.</p>
		<code>{secret}</code>
		<div class="actions">
			<Button onclick={copy}>Copy</Button>
			<Button onclick={close}>Done</Button>
		</div>
	</div>
{:else}
	<Button pending={save.isPending} onclick={run}>
		{held ? 'Rotate secret' : 'Generate secret'}
	</Button>
{/if}

<style>
	.minted {
		display: flex;
		flex-direction: column;
		gap: 0.8em;
	}

	.minted p {
		margin: 0;
		font-size: 0.85em;
		color: var(--muted);
	}

	.minted code {
		padding: 0.6em 0.7em;
		border-radius: var(--radius);
		background: var(--bg);
		box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.45);
		font-family: var(--font-mono);
		font-size: 0.82em;
		overflow-wrap: anywhere;
	}

	.actions {
		display: flex;
		gap: 0.4em;
	}
</style>
