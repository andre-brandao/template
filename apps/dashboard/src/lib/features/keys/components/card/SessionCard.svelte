<script lang="ts">
	import type { Key } from '@template/core/key';
	import { Button } from '@template/ui';
	import { removeKey } from '../../api/keys.remote';

	let { session }: { session: Key.Info } = $props();

	const revoke = $derived(removeKey.for(session.id));

	const used = $derived(
		session.timeUsed
			? `last active ${new Date(session.timeUsed).toLocaleString()}`
			: 'never active'
	);

	const expires = $derived(
		session.expiresAt ? `expires ${new Date(session.expiresAt).toLocaleDateString()}` : null
	);
</script>

<li class:current={session.current}>
	{#each revoke.fields.allIssues() ?? [] as issue}
		<p class="error">{issue.message}</p>
	{/each}

	<div class="meta">
		<span class="name">
			{session.current ? 'This device' : 'Other device'}
			{#if session.current}<span class="badge">current</span>{/if}
		</span>
		<span class="sub">{used}{expires ? ` · ${expires}` : ''}</span>
	</div>

	<!-- Masked only: a session secret is never handed back out, so there is nothing to reveal. -->
	<code>{session.display}</code>

	<div class="actions">
		<form {...revoke}>
			<input {...revoke.fields.id.as('hidden', session.id)} />
			<Button variant="danger" type="submit" pending={!!revoke.pending}>
				{session.current ? 'Sign out' : 'Revoke'}
			</Button>
		</form>
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

	li.current {
		border-color: var(--accent);
	}

	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		min-width: 12em;
	}

	.name {
		display: flex;
		align-items: center;
		gap: 0.5em;
		font-weight: 600;
	}

	.badge {
		font-family: var(--font-mono);
		font-size: 0.68em;
		font-weight: 400;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 0.15em 0.45em;
		border-radius: var(--radius);
		background: var(--surface-2);
		color: var(--muted);
	}

	.sub {
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

	.actions {
		display: flex;
		align-items: center;
		gap: 0.4em;
		margin-left: auto;
	}

	.error {
		flex-basis: 100%;
		margin: 0 0 0.4em;
		color: var(--danger, crimson);
	}
</style>
