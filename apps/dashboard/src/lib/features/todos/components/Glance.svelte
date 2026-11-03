<!-- Every todo opened in the last 90 days, as one rule split by where each stands now. -->
<script lang="ts">
	import { last } from '@template/ui';
	import Rule from '$lib/components/Rule.svelte';
	import { getStatus } from '../api/insights.remote';
	import { color, label, STATUSES } from '../status';

	// A quarter, not insights' month: the glance before you go anywhere spans more than a sprint.
	const range = last(90);

	// The same five columns, unmeasured — the shape the real rule lands in.
	const blank = STATUSES.map((status) => ({
		label: label(status),
		color: 'var(--surface-2)',
		pct: 1
	}));
</script>

<svelte:boundary>
	{#snippet pending()}<Rule parts={blank} />{/snippet}
	{@const status = await getStatus(range)}
	<!-- Core sizes each bar against the largest bucket; the rule wants a share of the whole. -->
	<Rule
		parts={status.rows.map((row) => ({
			label: label(row.status),
			value: row.total,
			color: color(row.status),
			pct: status.total === 0 ? 0 : (row.total / status.total) * 100
		}))}
	/>
</svelte:boundary>
