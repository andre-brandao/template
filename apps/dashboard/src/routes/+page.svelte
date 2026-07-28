<script lang="ts">
	import { user } from '$lib/context/user';
	import { org } from '$lib/context/org';

	const me = user();
	const ctx = org();
	const current = $derived(me.current);
</script>

<section>
	<h1>Todos</h1>
	<p>A small dashboard for tracking work — capture todos, move them through stages, and see how things trend over time.</p>
	{#if current}
		<div class="actions">
			<a class="btn" href={ctx.path('/todos')}>Todos</a>
			<a class="btn" href={ctx.path('/insights')}>Insights</a>
		</div>
	{:else}
		<div class="actions">
			<a class="btn" href="/login">Log in</a>
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
</style>
