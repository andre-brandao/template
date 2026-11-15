<script lang="ts">
	import { Button, FormBoundary, Issue, modal } from '@template/ui';
	import { rotateSecret } from '../../api/apps.remote';

	let { id, held }: { id: string; held: boolean } = $props();

	const rotate = $derived(rotateSecret.for(id));

	// Local, not `rotate.result`: a remount must not show the last secret again.
	let secret = $state('');

	const copy = () => navigator.clipboard.writeText(secret);
</script>

{#snippet warn()}
	The current secret stops working immediately.
{/snippet}

<FormBoundary>
	{#each rotate.fields.allIssues() ?? [] as issue (issue)}
		<Issue>{issue.message}</Issue>
	{/each}

	{#if secret}
		<div class="minted">
			<p>Copy it now — it is never shown again. Rotating replaces it at once.</p>
			<code>{secret}</code>
			<div class="actions">
				<Button onclick={copy}>Copy</Button>
				<Button onclick={() => (secret = '')}>Done</Button>
			</div>
		</div>
	{:else}
		<form
			{...rotate.enhance(async (form) => {
				// Rotating breaks whatever is signing with the current secret, so ask first.
				if (
					held &&
					!(await modal.confirm({
						title: 'Rotate secret',
						action: 'Rotate secret',
						body: warn
					}))
				)
					return;
				await form.submit();
				secret = (await rotate.result)?.secret ?? '';
			})}
		>
			<input {...rotate.fields.id.as('hidden', id)} />
			<Button type="submit" pending={!!rotate.pending}>
				{held ? 'Rotate secret' : 'Generate secret'}
			</Button>
		</form>
	{/if}
</FormBoundary>

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
