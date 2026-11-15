<script lang="ts">
	import { Button, Field, Input, Issue, modal } from '@template/ui';
	import { issue } from '../../api/apps.query';
	import { mint } from '../../api/keys.query';
	import Reveal from '../Reveal.svelte';

	// Modal content. `app` mints the key for that App instead of for the signed-in user.
	let { app, close }: { app?: string; close: () => void } = $props();

	let name = $state('');
	let ttl = $state('');

	// Opening the reveal replaces this modal, so the secret never outlives it.
	const done = (data: { key: string | null }) =>
		modal(Reveal, { title: app ? 'New API key' : 'New token', secret: data.key ?? '' });
	const own = mint({ onSuccess: done });
	const its = issue({ onSuccess: done });
	const save = $derived(app ? its : own);

	function submit(e: SubmitEvent) {
		e.preventDefault();
		const body = { name, expiresInDays: ttl ? Number(ttl) : undefined };
		if (app) return its.mutate({ app, ...body });
		own.mutate({ body });
	}
</script>

<h2>{app ? 'New API key' : 'New token'}</h2>

<form onsubmit={submit}>
	{#if save.error}
		<Issue>{save.error.message}</Issue>
	{/if}
	<Field label="Name">
		<Input
			placeholder="e.g. laptop"
			required
			value={name}
			oninput={(e) => (name = e.currentTarget.value)}
		/>
	</Field>
	<Field label="Expires">
		<select bind:value={ttl}>
			<option value="">Never</option>
			<option value="30">30 days</option>
			<option value="90">90 days</option>
			<option value="365">1 year</option>
		</select>
	</Field>
	<div class="actions">
		<Button variant="ghost" onclick={close}>Cancel</Button>
		<Button type="submit" pending={save.isPending}>Create</Button>
	</div>
</form>

<style>
	h2 {
		margin: 0 0 1em;
		font-size: 1.05em;
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 0.9em;
	}

	select {
		width: 100%;
		padding: 0.5em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: var(--surface);
		color: var(--ink);
		font: inherit;
	}

	select:focus-visible {
		border-color: var(--accent);
		outline: none;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.4em;
	}
</style>
