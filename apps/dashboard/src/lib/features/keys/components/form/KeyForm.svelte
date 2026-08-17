<script lang="ts">
	import { Button, Field, FormBoundary, Input, Issue } from '@template/ui';
	import { createKey } from '../../api/keys.remote';

	let { onsuccess }: { onsuccess?: () => void } = $props();

	// The row keeps a hash, so this is the only render the secret exists in. Local, not
	// `createKey.result`: reopening the drawer must not show the last key again.
	let secret = $state('');

	const copy = () => navigator.clipboard.writeText(secret);
</script>

<FormBoundary>
	{#each createKey.fields.allIssues() ?? [] as issue (issue)}
		<Issue>{issue.message}</Issue>
	{/each}

	{#if secret}
		<div class="minted">
			<p>Copy it now — it is never shown again. Lose it and the key has to be replaced.</p>
			<code>{secret}</code>
			<div class="actions">
				<Button onclick={copy}>Copy</Button>
				<Button onclick={() => onsuccess?.()}>Done</Button>
			</div>
		</div>
	{:else}
		<form
			class="add"
			{...createKey.enhance(async (f) => {
				await f.submit();
				secret = (await createKey.result)?.key ?? '';
			})}
		>
			<Field label="Name" style="flex: 1 1 14em">
				<Input placeholder="e.g. laptop" {...createKey.fields.name.as('text')} />
			</Field>
			<Field label="Expires" style="flex: 0 1 auto">
				<select name="ttl">
					<option value="">Never expires</option>
					<option value="30">30 days</option>
					<option value="90">90 days</option>
					<option value="365">1 year</option>
				</select>
			</Field>
			<Button type="submit" pending={!!createKey.pending}>Create</Button>
		</form>
	{/if}
</FormBoundary>

<style>
	.add {
		display: flex;
		align-items: end;
		flex-wrap: wrap;
		gap: 0.6em;
		margin-bottom: 1.5em;
	}

	select {
		min-width: 0;
		padding: 0.5em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
	}

	select:focus-visible {
		border-color: var(--accent);
		outline: none;
	}

	.minted {
		display: flex;
		flex-direction: column;
		gap: 0.8em;
		margin-bottom: 1.5em;
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
