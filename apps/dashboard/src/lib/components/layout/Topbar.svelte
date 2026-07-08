<script lang="ts">
	let { loggedIn }: { loggedIn: boolean } = $props();
</script>

<header>
	<a href="/" class="brand"><span class="dot"></span>Todos</a>
	{#if loggedIn}
		<a href="/logout">Log out</a>
	{:else}
		<a href="/login">Log in</a>
	{/if}
</header>

<style>
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
		padding: 0.9em 1.25em;
		border-bottom: 1px solid var(--border);
		background: var(--surface);
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.55em;
		font-family: var(--font-mono);
		font-size: 0.85em;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--ink);
		text-decoration: none;
	}

	.dot {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		background: var(--accent);
	}

	header > a:not(.brand) {
		font-family: var(--font-mono);
		font-size: 0.82em;
		color: var(--muted);
		text-decoration: none;
	}

	header > a:not(.brand):hover {
		color: var(--ink);
	}
</style>
