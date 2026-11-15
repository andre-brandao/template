<script lang="ts">
	import type { Snippet } from 'svelte';
	import { createQuery } from '@tanstack/svelte-query';
	import type { User } from '@template/core/user';
	import { Avatar, Badge, Empty, Issue, Section, Skeleton } from '@template/ui';
	import * as Header from '$lib/components/header';
	import { user } from '$lib/utils/context';
	import { fmt } from '$lib/utils/fmt';
	import { get } from '../api/people.query';
	import Activity from '../components/Activity.svelte';

	type Profile = User.Profile & { self: boolean; manage: boolean };

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
	const me = user();
	const profile = createQuery(() => get(id));

	// Hides controls only; the server checks the same grants on every write.
	const self = $derived(me.current?.id === id);
	const manage = $derived(profile.data?.kind === 'system' && me.can({ app: ['update'] }));
</script>

{#snippet loading()}
	<div class="loading" aria-busy="true">
		<Skeleton h="48px" w="48px" round />
		<div class="lines">
			<Skeleton h="1.4em" w="12em" />
			<Skeleton h="1em" w="20em" />
		</div>
	</div>
{/snippet}

{#snippet header(data: User.Profile)}
	<Header.Root>
		{#snippet title()}
			<span class="title">
				<Avatar name={data.name} image={data.image} size={48} />
				{#if name}
					{@render name({ ...data, self, manage })}
				{:else}
					<span class="name">{data.name}</span>
				{/if}
				{#if self}<span class="you"><Badge tone="accent">You</Badge></span>{/if}
			</span>
		{/snippet}
		{#snippet eyebrow()}{data.kind === 'system' ? 'App' : 'Person'}{/snippet}
		<Header.Item label="Role"><span class="role">{data.role}</span></Header.Item>
		{#if data.owner}
			<Header.Item label="Owner"><a href={`/u/${data.owner.id}`}>{data.owner.name}</a></Header.Item>
		{/if}
		{#if data.email}
			<Header.Item label="Email"><a href={`mailto:${data.email}`}>{data.email}</a></Header.Item>
		{/if}
		<Header.Item label="Joined">
			<time datetime={data.timeCreated} title={f.stamp(data.timeCreated)}>
				{f.date(data.timeCreated)}
			</time>
		</Header.Item>
	</Header.Root>
{/snippet}

{#if profile.isPending}
	{@render loading()}
{:else if profile.isError && profile.error.type !== 'not_found'}
	<Issue retry={() => profile.refetch()}>{profile.error.message}</Issue>
{:else if profile.isError}
	<Empty>
		No such account, or it was disabled.
		{#snippet action()}<a href="/home">Back home</a>{/snippet}
	</Empty>
{:else}
	{@render header(profile.data)}

	{#if (self || manage) && edit}
		<Section title="Profile" description="The name and avatar others see.">
			{@render edit({ ...profile.data, self, manage })}
		</Section>
	{/if}

	{#if manage && app}
		{@render app()}
	{/if}

	<Section divider title="Activity" description="What this account changed, newest first.">
		<Activity {id} />
	</Section>
{/if}

<style>
	.loading {
		display: flex;
		align-items: center;
		gap: 1em;
		padding-block: 0.5em 1.5em;
	}

	.lines {
		display: flex;
		flex-direction: column;
		gap: 0.5em;
	}

	.title {
		display: inline-flex;
		align-items: center;
		gap: 0.6em;
		min-width: 0;
	}

	.name {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* The badge sizes in em, so out of the h1 it reads as a badge, not a heading. */
	.you {
		font-size: 0.8rem;
		font-weight: 400;
	}

	.role {
		text-transform: capitalize;
	}
</style>
