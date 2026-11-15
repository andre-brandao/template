<!--
	The bar's right end: the signed-in user's avatar menu, or a log-in link when there is
	nobody. Self-contained so the Topbar stays layout and the account's own branching
	(grants, signed out) lives with the markup it guards.
-->
<script lang="ts">
	import { resolve } from '$app/paths';
	import type { User } from '@template/core/user';
	import { Avatar, IconButton, Menu } from '@template/ui';
	import ThemeToggle from './ThemeToggle.svelte';
	import Can from '../Can.svelte';

	let { user }: { user: User.Info | null } = $props();
</script>

{#if user}
	<div class="side">
		<Menu.Root label="Account" align="end">
			{#snippet trigger(attrs)}
				<!-- Just the face: the menu it opens says who. -->
				<IconButton label="Account of {user.name}" {...attrs}>
					<Avatar name={user.name} image={user.image} />
				</IconButton>
			{/snippet}
			<Menu.Label hint={user.email}>{user.name}</Menu.Label>
			<Menu.Separator />
			<Menu.Item href="/u/{user.id}">Profile</Menu.Item>
			<Menu.Item href={resolve('/settings/account')}>Settings</Menu.Item>
			<Menu.Item href={resolve('/developers')}>Developers</Menu.Item>
			<Can grants={{ admin: ['read'] }}>
				<Menu.Item href={resolve('/admin')}>Admin</Menu.Item>
			</Can>
			<ThemeToggle />
			<Menu.Item href={resolve('/logout')}>Log out</Menu.Item>
		</Menu.Root>
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
</style>
