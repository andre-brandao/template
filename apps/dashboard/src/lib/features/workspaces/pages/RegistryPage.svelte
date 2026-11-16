<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Issue, Scroll, Section, Skeleton } from '@template/ui';
	import * as Header from '#lib/components/header/index.ts';
	import { size } from '#lib/utils/size.ts';
	import { mode, registry } from '../api/workspaces.query';
	import CreateForm from '../components/CreateForm.svelte';
	import RegistryTable from '../components/RegistryTable.svelte';

	const kind = createQuery(mode);
	const list = createQuery(registry);
</script>

<Header.Root title="Workspaces" lead="Every tenant on the instance.">
	{#if list.isSuccess}
		<Header.Item label="Workspaces">{list.data.rows.length}</Header.Item>
		<Header.Item label="Tenant data">
			{size(list.data.rows.reduce((sum, one) => sum + one.bytes, 0))}
		</Header.Item>
		<Header.Item label="Central">{size(list.data.central)}</Header.Item>
	{/if}
	{#if kind.isSuccess}
		<Header.Item label="Mode">{kind.data}</Header.Item>
	{/if}
</Header.Root>

{#if list.isError}
	<Issue>{list.error.message}</Issue>
{:else if list.isSuccess}
	<Scroll>
		<RegistryTable rows={list.data.rows} />
	</Scroll>
{:else}
	<Skeleton h="12em" />
{/if}

{#if kind.data === 'multi'}
	<Section divider title="Create a workspace" description="You become its owner.">
		<CreateForm />
	</Section>
{/if}
