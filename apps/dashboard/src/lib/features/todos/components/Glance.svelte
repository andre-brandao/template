<!-- Every todo opened in the last 90 days, as one rule split by where each stands now. -->
<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Issue, last } from '@template/ui';
	import Rule from '$lib/components/Rule.svelte';
	import { statuses } from '../api/todos.query';
	import { color, label, STATUSES } from '../status';

	// A quarter, not insights' month: the glance before you go anywhere spans more than a sprint.
	const query = createQuery(() => statuses(last(90)));

	// The same five columns, unmeasured — the shape the real rule lands in.
	const blank = STATUSES.map((status) => ({
		label: label(status),
		color: 'var(--surface-2)',
		pct: 1
	}));
</script>

{#if query.isPending}
	<Rule parts={blank} />
{:else if query.isError}
	<Issue>{query.error.message}</Issue>
{:else}
	<!-- Core sizes each bar against the largest bucket; the rule wants a share of the whole. -->
	<Rule
		parts={query.data.rows.map((row) => ({
			label: label(row.status),
			value: row.total,
			color: color(row.status),
			pct: query.data.total === 0 ? 0 : (row.total / query.data.total) * 100
		}))}
	/>
{/if}
