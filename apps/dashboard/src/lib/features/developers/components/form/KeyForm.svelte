<script lang="ts">
	import { Button, Field, Input, Issue } from '@template/ui';
	import { issue, mint } from '../../api/developers.query';

	// `app` mints the key for that App instead of for the signed-in user.
	let { app, onsuccess }: { app?: string; onsuccess?: () => void } = $props();

	// The row keeps a hash, so this is the only render the secret exists in. Local, not the
	// mutation's data: reopening the drawer must not show the last key again.
	let secret = $state('');
	let name = $state('');
	let ttl = $state('');

	const done = (data: { key: string | null }) => {
		secret = data.key ?? '';
		name = '';
		ttl = '';
	};
	const own = mint({ onSuccess: done });
	const its = issue({ onSuccess: done });
	const save = $derived(app ? its : own);

	const copy = () => navigator.clipboard.writeText(secret);

	function submit(e: SubmitEvent) {
		e.preventDefault();
		const body = { name, expiresInDays: ttl ? Number(ttl) : undefined };
		if (app) return its.mutate({ path: { id: app }, body });
		own.mutate({ body });
	}

	// Reset drops the secret the mutation still holds in its data.
	function close() {
		secret = '';
		save.reset();
		onsuccess?.();
	}
</script>

{#if save.error}
	<Issue>{save.error.message}</Issue>
{/if}

{#if secret}
	<div class="minted">
		<p>Copy it now — it is never shown again. Lose it and the {app ? "API key" : "token"} has to be replaced.</p>
		<code>{secret}</code>
		<div class="actions">
			<Button onclick={copy}>Copy</Button>
			<Button onclick={close}>Done</Button>
		</div>
	</div>
{:else}
	<form class="add" onsubmit={submit}>
		<Field label="Name" style="flex: 1 1 14em">
			<Input
				placeholder="e.g. laptop"
				required
				value={name}
				oninput={(e) => (name = e.currentTarget.value)}
			/>
		</Field>
		<Field label="Expires" style="flex: 0 1 auto">
			<select bind:value={ttl}>
				<option value="">Never expires</option>
				<option value="30">30 days</option>
				<option value="90">90 days</option>
				<option value="365">1 year</option>
			</select>
		</Field>
		<Button type="submit" pending={save.isPending}>Create</Button>
	</form>
{/if}

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
