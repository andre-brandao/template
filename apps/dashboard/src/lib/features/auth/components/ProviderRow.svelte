<script lang="ts">
	import type { User } from '@template/core/user';

	let { provider }: { provider: User.Provider } = $props();

	const labels: Record<User.Provider['id'], string> = {
		email: 'Email & password',
		github: 'GitHub',
		google: 'Google'
	};

	const label = $derived(labels[provider.id]);
	const since = $derived(
		provider.timeCreated
			? `connected ${new Date(provider.timeCreated).toLocaleDateString()}`
			: 'not connected'
	);
</script>

<li class:connected={provider.connected}>
	<div class="meta">
		<span class="name">{label}</span>
		<span class="sub">{provider.accountId ?? since}</span>
	</div>

	{#if provider.connected}
		<span class="pill on">Connected</span>
	{:else}
		<span class="pill off">Not connected</span>
	{/if}
</li>

<style>
	li {
		display: flex;
		align-items: center;
		gap: 1em;
		padding: 0.8em 1em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}

	li.connected {
		border-color: var(--accent);
	}

	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.15em;
	}

	.name {
		font-weight: 600;
	}

	.sub {
		font-family: var(--font-mono);
		font-size: 0.76em;
		color: var(--dim);
	}

	.pill {
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 0.7em;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		padding: 0.25em 0.6em;
		border-radius: var(--radius);
		white-space: nowrap;
	}

	.pill.on {
		color: var(--ink);
		background: var(--surface-2);
	}

	.pill.off {
		color: var(--dim);
		background: transparent;
		border: 1px dashed var(--border);
	}
</style>
