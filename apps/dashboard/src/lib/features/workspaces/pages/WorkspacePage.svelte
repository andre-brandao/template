<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Empty, Issue, Section, Skeleton } from '@template/ui';
	import * as Header from '#lib/components/header/index.ts';
	import { user } from '#lib/utils/context.ts';
	import { current, members, mode } from '../api/workspaces.query';
	import CreateForm from '../components/CreateForm.svelte';
	import GeneralForm from '../components/GeneralForm.svelte';
	import MembersTable from '../components/MembersTable.svelte';
	import Mine from '../components/Mine.svelte';

	const me = user();
	const kind = createQuery(mode);
	const here = createQuery(current);
	const people = createQuery(members);

	const multi = $derived(kind.data === 'multi');
	// Hides controls only; core decides who may edit.
	const manager = $derived(
		here.data?.role === 'owner' || here.data?.role === 'admin' || me.can({ admin: ['read'] })
	);
</script>

<Header.Root title="Workspace" lead="The workspace you're in and who's in it." />

{#if here.isError}
	<Issue>{here.error.message}</Issue>
{:else if here.isSuccess && kind.isSuccess}
	{#if here.data}
		<Section title="General" description="What everyone in the workspace sees it called.">
			<GeneralForm workspace={here.data} {multi} disabled={!manager} />
		</Section>

		<Section divider wide title="Members">
			{#if people.isError}
				<Issue>{people.error.message}</Issue>
			{:else if people.isSuccess}
				<MembersTable rows={people.data} {manager} self={me.current?.id} />
			{:else}
				<Skeleton h="8em" />
			{/if}
		</Section>
	{:else}
		<Empty>Pick a workspace to work in.</Empty>
	{/if}

	{#if multi}
		<Section divider title="Your workspaces" description="Switching reloads the app inside it.">
			<Mine current={here.data?.slug} />
		</Section>

		<Section divider title="Create a workspace" description="You become its owner.">
			<CreateForm />
		</Section>
	{/if}
{:else}
	<Skeleton h="12em" />
{/if}
