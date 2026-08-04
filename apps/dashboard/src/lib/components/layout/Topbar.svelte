<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { dev } from '$app/environment';
	import type { User } from '@template/core/user';
	import Avatar from '../Avatar.svelte';

	// `onmenu` is passed exactly where a sidebar exists to open, so it doubles as the
	// signal to render the rail — the left cell that lines up with that sidebar.
	let {
		user,
		onmenu,
		head
	}: { user: User.Info | null; onmenu?: () => void; head?: Snippet } = $props();

	// A shortcut into settings; the sidebar's "Settings" link lands on the same page.
	const active = $derived(page.url.pathname.startsWith('/settings'));
</script>

<header>
	<div class="lead" class:rail={!!onmenu}>
		{#if onmenu}
			<button class="menu" type="button" aria-label="Open menu" onclick={onmenu}>
				<span aria-hidden="true">&#9776;</span>
			</button>
		{/if}
		<a href="/" class="brand" aria-label="Home">
			<span class="dot"></span>
			{#if !head}<span class="word">Todos</span>{/if}
		</a>
		{@render head?.()}
	</div>

	{#if dev}
		<span class="env" title="Not production — data here is throwaway">dev</span>
	{/if}

	{#if user}
		<div class="side">
			<a class="me" href="/settings/profile" aria-current={active ? 'page' : undefined}>
				<Avatar name={user.name} image={user.image} />
				<span class="meta">
					<span class="name">{user.name}</span>
					<span class="email">{user.email}</span>
				</span>
			</a>
			<a href="/logout">Log out</a>
		</div>
	{:else}
		<a class="login" href="/login">Log in</a>
	{/if}
</header>

<style>
	header {
		position: sticky;
		top: 0;
		z-index: 20;
		display: flex;
		align-items: stretch;
		gap: 1em;
		/* Fixed, so a taller control in the rail can't grow the bar. */
		height: var(--topbar);
		padding-right: 1.25em;
		border-bottom: 1px solid var(--border);
		background: var(--surface);
	}

	.lead {
		display: flex;
		align-items: center;
		gap: 0.55em;
		min-width: 0;
		padding-inline: 1.25em;
	}

	/* Same width and divider as the sidebar below it, so the two read as one column. */
	.rail {
		width: var(--rail);
		flex-shrink: 0;
		padding-inline: 0.75em;
		border-right: 1px solid var(--border);
	}

	.menu {
		display: none;
		flex-shrink: 0;
		padding: 0.3em 0.6em;
		font-size: 1em;
		line-height: 1;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface-2);
		color: var(--ink);
		cursor: pointer;
	}

	.menu:hover {
		border-color: var(--border-bright);
	}

	.brand {
		display: inline-flex;
		align-items: center;
		gap: 0.55em;
		flex-shrink: 0;
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

	/* Loud on purpose: the whole point is to catch the eye of someone who thinks
	   they are looking at production. Sits outside `.lead` so it trails the project
	   switcher instead of competing with it for the rail's width. */
	.env {
		flex-shrink: 0;
		align-self: center;
		padding: 0.15em 0.5em;
		font-family: var(--font-mono);
		font-size: 0.66em;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		border-radius: var(--radius);
		border: 1px solid color-mix(in oklab, var(--progress) 45%, transparent);
		background: color-mix(in oklab, var(--progress) 16%, var(--surface));
		color: var(--progress);
	}

	.side {
		display: flex;
		align-items: center;
		gap: 1.1em;
		margin-left: auto;
	}

	/* `header` stretches its children, so without this the link fills the bar's
	   height and its text rides the top edge. */
	.login {
		align-self: center;
		margin-left: auto;
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

	@media (max-width: 700px) {
		/* The sidebar is off canvas here, so there is no column left to align to. */
		.rail {
			width: auto;
			border-right: none;
		}

		.menu {
			display: block;
		}

		.meta {
			display: none;
		}
	}
</style>
