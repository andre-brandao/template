<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';
	import { dev } from '$app/environment';
	import { resolve } from '$app/paths';
	import type { User } from '@template/core/user';
	import Avatar from '../Avatar.svelte';
	import Menu from '../Menu.svelte';
	import Breadcrumbs from './Breadcrumbs.svelte';

	// `onmenu` is passed exactly where a sidebar exists to open, so it doubles as the
	// signal to render the rail — the left cell that lines up with that sidebar.
	let {
		user,
		onmenu,
		head,
		crumbs
	}: {
		user: User.Info | null;
		onmenu?: () => void;
		head?: Snippet;
		crumbs?: { href?: string; label: string }[];
	} = $props();

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
		<a href={resolve('/')} class="brand" aria-label="Home">
			<span class="dot"></span>
			{#if !head}<span class="word">Todos</span>{/if}
		</a>
		{@render head?.()}
	</div>

	{#if crumbs}<Breadcrumbs items={crumbs} />{/if}

	{#if dev}
		<span class="env" title="Not production — data here is throwaway">dev</span>
	{/if}

	{#if user}
		<div class="side">
			<Menu align="end">
				{#snippet trigger(attrs)}
					<button class="me" type="button" {...attrs}>
						<Avatar name={user.name} image={user.image} />
						<span class="meta">
							<span class="name">{user.name}</span>
							<span class="email">{user.email}</span>
						</span>
						<span class="caret" aria-hidden="true">▾</span>
					</button>
				{/snippet}
				{#snippet children(close)}
					<div class="sheet">
						<!-- The bar hides name and email on small screens; the menu carries them instead. -->
						<div class="who">
							<span class="name">{user.name}</span>
							<span class="email">{user.email}</span>
						</div>
						<a
							class="item"
							role="menuitem"
							href={resolve('/settings/profile')}
							aria-current={active ? 'page' : undefined}
							onclick={close}>Settings</a
						>
						<a class="item leave" role="menuitem" href={resolve('/logout')} onclick={close}
							>Log out</a
						>
					</div>
				{/snippet}
			</Menu>
		</div>
	{:else}
		<a class="login" href={resolve('/login')}>Log in</a>
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
		margin-left: auto;
	}

	/* `header` stretches its children, so without this the link fills the bar's
	   height and its text rides the top edge. */
	.login {
		align-self: center;
		margin-left: auto;
		font-family: var(--font-mono);
		font-size: 0.82em;
		color: var(--muted);
		text-decoration: none;
	}

	.login:hover {
		color: var(--ink);
	}

	.me {
		display: inline-flex;
		align-items: center;
		gap: 0.6em;
		padding: 0.25em 0.5em;
		margin: -0.25em -0.5em;
		border: none;
		border-radius: var(--radius);
		background: none;
		font: inherit;
		text-align: left;
		color: var(--ink);
		cursor: pointer;
	}

	.me:hover,
	.me[aria-expanded='true'] {
		background: var(--surface-2);
	}

	.caret {
		font-size: 0.7em;
		color: var(--dim);
	}

	.sheet {
		min-width: 13em;
		padding: 0.35em;
	}

	.who {
		display: flex;
		flex-direction: column;
		gap: 0.1em;
		padding: 0.5em 0.65em 0.6em;
		margin-bottom: 0.35em;
		border-bottom: 1px solid var(--border);
	}

	.item {
		display: block;
		padding: 0.5em 0.65em;
		border-radius: calc(var(--radius) - 3px);
		font-size: 0.88em;
		color: var(--ink);
		text-decoration: none;
	}

	.item:hover,
	.item[aria-current='page'] {
		background: var(--surface-2);
	}

	.leave {
		color: var(--muted);
	}

	.leave:hover {
		color: var(--danger);
		background: color-mix(in srgb, var(--danger) 8%, transparent);
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

	@media (max-width: 700px) {
		/* The sidebar is off canvas here, so there is no column left to align to. */
		.rail {
			width: auto;
			flex-shrink: 1;
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
