<script lang="ts">
	import type { Key } from '@template/core/key';
	import RevokeForm from '../RevokeForm.svelte';

	let { session }: { session: Key.Info } = $props();

	const label = $derived(session.current ? 'This device' : 'Other device');
	const action = $derived(session.current ? 'Sign out' : 'Revoke');
	const used = $derived(
		session.timeUsed
			? `last active ${new Date(session.timeUsed).toLocaleString()}`
			: 'never active'
	);
	const expires = $derived(
		session.expiresAt ? ` · expires ${new Date(session.expiresAt).toLocaleDateString()}` : ''
	);
</script>

<li class:current={session.current}>
	<div class="meta">
		<span class="name">
			{label}
			{#if session.current}<span class="badge">current</span>{/if}
		</span>
		<span class="sub">{used}{expires}</span>
	</div>

	<!-- Masked only: a session secret is never handed back out, so there is nothing to reveal. -->
	<code>{session.display}</code>

	<div class="actions">
		<RevokeForm id={session.id} label={action} />
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
</style>
