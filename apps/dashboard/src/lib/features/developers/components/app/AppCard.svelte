<script lang="ts">
	import type { App } from '@template/core/app';
	import { Card } from '@template/ui';
	import { fmt } from '$lib/utils/fmt';

	let { app }: { app: App.Info } = $props();

	const f = fmt();
</script>

<li>
	<Card href={`/developers/apps/${app.id}`} accent={app.inbound ? 'var(--accent)' : 'var(--dim)'} interactive dense>
		<div class="row">
			<span class="name">{app.name}</span>
			<span class="meta">
				{app.owner ? `owned by ${app.owner.name}` : 'no owner'} · {app.inbound
					? 'inbound on'
					: 'no inbound'} · since {f.date(app.timeCreated)}
			</span>
		</div>
	</Card>
</li>

<style>
	.row {
		display: flex;
		flex-direction: column;
		gap: 0.15em;
	}

	.name {
		font-weight: 600;
	}

	.meta {
		font-size: 0.78em;
		color: var(--dim);
	}
</style>
