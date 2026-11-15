<!--
	The bar's right end: the signed-in user's avatar menu, or a log-in link when there is
	nobody. Self-contained so the Topbar stays layout and the account's own branching
	(grants, signed out) lives with the markup it guards.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { resolve } from '$app/paths';
	import type { User } from '@template/core/user';
	import { Avatar, IconButton, Menu } from '@template/ui';
	import { user as session } from '#lib/utils/context.ts';
	import { account as links } from './nav';

	let { user, account }: { user: User.Info | null; account?: Snippet } = $props();

	const me = session();
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
			{#each links(user.id) as link (link.href)}
				{#if me.can(link.grants ?? {})}<Menu.Item href={link.href}>{link.label}</Menu.Item>{/if}
			{/each}
			{@render account?.()}
			<Menu.Item href={resolve('logout')}>Log out</Menu.Item>
		</Menu.Root>
	</div>
{:else}
	<a class="login" href={resolve('login')}>Log in</a>
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
