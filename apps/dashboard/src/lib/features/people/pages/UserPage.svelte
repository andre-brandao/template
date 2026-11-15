<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Avatar, Empty, Section } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { fmt } from '$lib/utils/fmt';
	import { getHistory, getProfile } from '../api/people.remote';
	import Activity from '../components/Activity.svelte';

	type Profile = NonNullable<Awaited<ReturnType<typeof getProfile>>>;

	// Editing is the route's to supply: it composes the forms from the slices that own them.
	let {
		id,
		name,
		edit,
		app
	}: {
		id: string;
		/** Stands in for the name in the header, e.g. an Inline rename when the reader manages it. */
		name?: Snippet<[Profile]>;
		/** Rendered when the reader may change this account: their own, or an App they manage. */
		edit?: Snippet<[Profile]>;
		/** Rendered on an App's profile for an admin: its keys, inbound endpoint and webhooks. */
		app?: Snippet;
	} = $props();

	const f = fmt();
	const profile = $derived(await getProfile(id));
</script>

{#if !profile}
	<Empty>No such account, or it was disabled.</Empty>
{:else}
	<Header.Root>
		{#snippet title()}
			<span class="title">
				<Avatar name={profile.name} image={profile.image} size={40} />
				{#if name}{@render name(profile)}{:else}{profile.name}{/if}
			</span>
		{/snippet}
		{#snippet eyebrow()}{profile.kind === 'system' ? 'App' : 'Person'}{/snippet}
		<Header.Item label="Role">{profile.role}</Header.Item>
		{#if profile.owner}
			<Header.Item label="Owner"><a href={`/u/${profile.owner.id}`}>{profile.owner.name}</a></Header.Item>
		{/if}
		{#if profile.email}
			<Header.Item label="Email">{profile.email}</Header.Item>
		{/if}
		<Header.Item label="Joined">{f.date(profile.timeCreated)}</Header.Item>
	</Header.Root>

	{#if (profile.self || profile.manage) && edit}
		<Section title="Profile" description="The name and avatar others see.">
			{@render edit(profile)}
		</Section>
	{/if}

	{#if profile.manage && app}
		{@render app()}
	{/if}

	<Section divider title="Activity" description="What this account changed, newest first.">
		<Activity events={await getHistory(id)} />
	</Section>
{/if}

<style>
	.title {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;
	}
</style>
