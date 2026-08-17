<script lang="ts">
	import type { ProviderId } from '@template/core/user/provider.sql';

	let { providers }: { providers: ProviderId[] } = $props();

	const labels: Partial<Record<ProviderId, string>> = { github: 'GitHub', google: 'Google' };
</script>

{#if providers.length}
	<div class="oauth">
		<span class="or">or continue with</span>
		<div class="row">
			{#each providers as provider (provider)}
				<a class="provider" href="/oauth?provider={provider}">{labels[provider] ?? provider}</a>
			{/each}
		</div>
	</div>
{/if}

<style>
	.oauth {
		display: flex;
		flex-direction: column;
		gap: 0.7em;
		align-items: center;
	}

	.or {
		font-family: var(--font-mono);
		font-size: 0.72em;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--dim);
	}

	.row {
		display: flex;
		gap: 0.6em;
		width: 100%;
	}

	.provider {
		flex: 1;
		padding: 0.55em 1em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		font-family: var(--font-mono);
		font-size: 0.85em;
		text-align: center;
		text-decoration: none;
	}

	.provider:hover {
		border-color: var(--accent);
	}
</style>
