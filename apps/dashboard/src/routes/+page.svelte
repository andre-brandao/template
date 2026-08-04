<script lang="ts">
	import { user } from '$lib/utils/context';
	import Topbar from '$lib/components/layout/Topbar.svelte';

	const me = user();
	const current = $derived(me.current);
</script>

<!-- The only page outside the app shell, so it carries its own header. -->
<Topbar user={current} />

<section>
	<h1>Todos</h1>
	<p>A small dashboard for tracking work — capture todos, move them through stages, and see how things trend over time.</p>
	{#if current}
		<div class="actions">
			<a href="/todos">Todos</a>
			<a href="/insights">Insights</a>
		</div>
	{:else}
		<div class="actions">
			<a href="/login">Log in</a>
		</div>
	{/if}
</section>

<style>
	section {
		max-width: 480px;
		margin: 4em auto 0;
		text-align: center;
	}

	h1 {
		font-family: var(--font-mono);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		font-size: 1.4em;
	}

	p {
		color: var(--muted);
		line-height: 1.6;
	}

	.actions {
		display: inline-flex;
		gap: 0.75em;
		margin-top: 1.5em;
	}

	.actions a {
		font-family: var(--font-mono);
		font-size: 0.85em;
		text-decoration: none;
		color: var(--ink);
		background: var(--surface-2);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		padding: 0.55em 1.1em;
	}

	.actions a:hover {
		border-color: var(--border-bright);
	}
</style>
