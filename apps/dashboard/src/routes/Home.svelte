<!--
  The signed-in half of `/`. It lives in its own component because the query below is
  conditional on being signed in, and a conditional `await` belongs inside a boundary
  rather than in a `$derived` the page evaluates either way.
-->
<script lang="ts">
	import { last } from '@template/ui';
	import Rule from '$lib/components/Rule.svelte';
	import { getStatus } from '$lib/features/todos/api/insights.remote';
	import { color, label, STATUSES } from '$lib/features/todos/status';

	let { name }: { name: string } = $props();

	// A quarter rather than the month insights opens on: this is the glance you take before
	// you go anywhere, so it should span more than the sprint you are already in.
	const range = last(90);

	// The same five columns, unmeasured — the shape the real rule lands in.
	const blank = STATUSES.map((status) => ({
		label: label(status),
		color: 'var(--surface-2)',
		pct: 1
	}));

	const places = [
		{ href: '/projects', label: 'Projects', hint: 'group work into spaces' },
		{ href: '/todos', label: 'Todos', hint: 'the board and the list' },
		{ href: '/files', label: 'Files', hint: 'everything attached, in one place' },
		{ href: '/insights', label: 'Insights', hint: 'trends once the dust settles' }
	];
</script>

<h1>Welcome back, {name}.</h1>
<p class="lead">Everything opened in the last 90 days, by where it stands now.</p>

<svelte:boundary>
	{#snippet pending()}<Rule parts={blank} />{/snippet}
	{@const status = await getStatus(range)}
	<!-- Core sizes each bar against the largest bucket; the rule wants a share of the whole. -->
	{@const parts = status.rows.map((row) => ({
		label: label(row.status),
		value: row.total,
		color: color(row.status),
		pct: status.total === 0 ? 0 : (row.total / status.total) * 100
	}))}
	<Rule {parts} />
</svelte:boundary>

<nav class="places" aria-label="Sections">
	{#each places as place (place.href)}
		<a href={place.href}>
			<span class="label">{place.label}</span>
			<span class="hint">{place.hint}</span>
		</a>
	{/each}
</nav>

<style>
	h1 {
		margin: 0;
		font-size: 1.5em;
		font-weight: 600;
	}

	.lead {
		margin: 0.4em 0 2.2em;
		color: var(--muted);
	}

	/* Quiet on purpose — the rule above is the one loud thing on the page. */
	.places {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75em;
		margin-top: 2.8em;
	}

	.places a {
		display: flex;
		flex-direction: column;
		gap: 0.3em;
		padding: 1em 1.1em;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		text-decoration: none;
	}

	.places a:hover {
		border-color: var(--border-bright);
	}

	.label {
		font-weight: 600;
		font-size: 0.95em;
		color: var(--ink);
	}

	.hint {
		font-family: var(--font-mono);
		font-size: 0.72em;
		color: var(--muted);
	}

	@media (max-width: 640px) {
		.places {
			grid-template-columns: 1fr;
		}
	}
</style>
