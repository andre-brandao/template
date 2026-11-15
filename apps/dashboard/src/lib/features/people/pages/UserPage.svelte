<script lang="ts">
	import type { Snippet } from 'svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import type { User } from '@template/core/user';
	import { Avatar, Issue, Section, Skeleton } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { user } from '$lib/utils/context';
	import { fmt } from '$lib/utils/fmt';
	import { get, history } from '../api/people.query';
	import Activity from '../components/Activity.svelte';

	// Editing is the route's to supply: it composes the forms from the slices that own them.
	let {
		id,
		edit,
		app
	}: {
		id: string;
		/** Rendered when the reader may change this account: their own, or an App they manage. */
		edit?: Snippet<[User.Profile & { self: boolean; manage: boolean }]>;
		/** Rendered on an App's profile for an admin: its keys, inbound endpoint and webhooks. */
		app?: Snippet;
	} = $props();

	const f = fmt();
	const me = user();
	const profile = createQuery(() => get(id));
	const events = createQuery(() => history(id));

	// Hides controls only; the server checks the same grants on every write.
	const self = $derived(me.current?.id === id);
	const manage = $derived(profile.data?.kind === 'system' && me.can({ app: ['update'] }));
</script>

{#snippet activity()}
	{#if events.isPending}
		<Skeleton h="6em" />
	{:else if events.isError}
		<Issue>{events.error.message}</Issue>
	{:else}
		<Activity events={events.data} />
	{/if}
{/snippet}

{#if profile.isPending}
	<Skeleton h="6em" />
{:else if profile.isError}
	<Issue>{profile.error.message}</Issue>
{:else}
	<Header.Root>
		{#snippet title()}
			<span class="title">
				<Avatar name={profile.data.name} image={profile.data.image} size={40} />
				{profile.data.name}
			</span>
		{/snippet}
		{#snippet eyebrow()}{profile.data.kind === 'system' ? 'App' : 'Person'}{/snippet}
		<Header.Item label="Role">{profile.data.role}</Header.Item>
		{#if profile.data.owner}
			<Header.Item label="Owner">
				<a href={`/u/${profile.data.owner.id}`}>{profile.data.owner.name}</a>
			</Header.Item>
		{/if}
		{#if profile.data.email}
			<Header.Item label="Email">{profile.data.email}</Header.Item>
		{/if}
		<Header.Item label="Joined">{f.date(profile.data.timeCreated)}</Header.Item>
	</Header.Root>

	{#if (self || manage) && edit}
		<Section title="Profile" description="The name and avatar others see.">
			{@render edit({ ...profile.data, self, manage })}
		</Section>
	{/if}

	{#if manage && app}
		{@render app()}
	{/if}

	<Section divider title="Activity" description="What this account changed, newest first.">
		{@render activity()}
	</Section>
{/if}

<style>
	.title {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
	}
</style>
