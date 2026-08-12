<!--
	The bar's right end: the signed-in user's avatar menu, or a log-in link when there is
	nobody. Self-contained so the Topbar stays layout — rail, brand, crumbs — and the
	account's own branching (grants, current page, signed out) lives with the markup it
	guards.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { User } from '@template/core/user';
	import Avatar from '../Avatar.svelte';
	import Can from '../Can.svelte';
	import Menu from '../Menu.svelte';

	let { user }: { user: User.Info | null } = $props();

	// A shortcut into settings; the sidebar's "Settings" link lands on the same page.
	const active = $derived(page.url.pathname.startsWith('/settings'));
</script>

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
					<Can grants={{ admin: ['read'] }}>
						<a class="item" role="menuitem" href={resolve('/admin')} onclick={close}>Admin</a>
					</Can>
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

<style>
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
		.meta {
			display: none;
		}
	}
</style>
