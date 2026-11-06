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
	import { Avatar } from '@template/ui';
	import ThemeToggle from './ThemeToggle.svelte';
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
				<!-- Just the face: the menu it opens says who. -->
				<button class="me" type="button" aria-label="Account of {user.name}" {...attrs}>
					<Avatar name={user.name} image={user.image} />
				</button>
			{/snippet}
			{#snippet children(close)}
				<div class="sheet">
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
					<ThemeToggle />
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

	/* `header` stretches its children, so without this the link rides the top edge. */
	.login {
		align-self: center;
		margin-left: auto;
		font-size: 0.93em;
		color: var(--muted);
		text-decoration: none;
	}

	.login:hover {
		color: var(--ink);
	}

	.me {
		display: inline-flex;
		align-items: center;
		padding: 0.2em;
		border: none;
		border-radius: 999px;
		background: none;
		font: inherit;
		color: var(--ink);
		cursor: pointer;
	}

	.me:hover,
	.me[aria-expanded='true'] {
		background: var(--hover);
	}

	.sheet {
		min-width: 14em;
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
		padding: 0.45em 0.65em;
		border-radius: var(--radius-sm);
		color: var(--ink);
		text-decoration: none;
	}

	.item:hover,
	.item[aria-current='page'] {
		background: var(--hover);
	}

	.leave {
		color: var(--muted);
	}

	.leave:hover {
		color: var(--danger);
		background: color-mix(in srgb, var(--danger) 8%, transparent);
	}

	.name {
		font-weight: 600;
		color: var(--ink);
	}

	.email {
		font-size: 0.86em;
		color: var(--dim);
	}
</style>
