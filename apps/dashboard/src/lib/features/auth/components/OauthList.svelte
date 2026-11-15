<script lang="ts">
	import { Button } from '@template/ui';
	import type { ProviderId } from '@template/core/auth/provider.sql';

	let { providers }: { providers: ProviderId[] } = $props();

	const labels: Partial<Record<ProviderId, string>> = { github: 'GitHub', google: 'Google' };
</script>

{#if providers.length}
	<div class="oauth">
		<span class="or">or continue with</span>
		<div class="row">
			{#each providers as provider (provider)}
				<Button variant="secondary" href="/oauth?provider={provider}"
					>{labels[provider] ?? provider}</Button
				>
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
		font-size: 0.86em;
		color: var(--dim);
	}

	/* Equal columns, so each provider button stretches to its share. */
	.row {
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 1fr;
		gap: 0.6em;
		width: 100%;
	}
</style>
