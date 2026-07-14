<script lang="ts">
	import { page } from '$app/state';
	import Avatar from '../Avatar.svelte';
	import { user } from '$lib/features/auth/context';

	const me = user();

	// The user chip is the only way into the profile — there is no sidebar link.
	const active = $derived(page.url.pathname.startsWith('/profile'));
</script>

<header>
	<a href="/" class="brand"><span class="dot"></span>Todos</a>

	{#if me}
		<div class="side">
			<a class="me" href="/profile" aria-current={active ? 'page' : undefined}>
				<Avatar name={me.name} image={me.image} />
				<span class="meta">
					<span class="name">{me.name}</span>
					<span class="email">{me.email}</span>
				</span>
			</a>
			<a href="/logout">Log out</a>
		</div>
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

	.side {
		display: flex;
		align-items: center;
		gap: 1.1em;
	}

	.me {
		display: inline-flex;
		align-items: center;
		gap: 0.6em;
		padding: 0.25em 0.5em;
		margin: -0.25em -0.5em;
		border-radius: var(--radius);
		text-decoration: none;
	}

	.me:hover,
	.me[aria-current='page'] {
		background: var(--surface-2);
	}

	.meta {
		display: flex;
		flex-direction: column;
		line-height: 1.25;
	}

	.name {
		font-size: 0.85em;
		font-weight: 600;
		color: var(--ink);
	}

	.email {
		font-family: var(--font-mono);
		font-size: 0.7em;
		color: var(--dim);
	}

	header a:not(.brand):not(.me) {
		font-family: var(--font-mono);
		font-size: 0.82em;
		color: var(--muted);
		text-decoration: none;
	}

	header a:not(.brand):not(.me):hover {
		color: var(--ink);
	}

	@media (max-width: 600px) {
		.meta {
			display: none;
		}
	}
</style>
