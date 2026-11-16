<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Badge, Button, Empty, Issue, Section, Skeleton } from '@template/ui';
	import * as Header from '#lib/components/header/index.ts';
	import { fmt } from '#lib/utils/fmt.ts';
	import { inspect, mode, retry, usage } from '../api/workspaces.query';
	import GeneralForm from '../components/GeneralForm.svelte';
	import MembersTable from '../components/MembersTable.svelte';
	import Usage from '../components/Usage.svelte';

	let { slug }: { slug: string } = $props();

	const f = fmt();
	const kind = createQuery(mode);
	const one = createQuery(() => inspect(slug));
	const disk = createQuery(() => usage(slug));
	const again = retry();
</script>

{#if one.isError}
	<Issue>{one.error.message}</Issue>
{:else if one.isSuccess}
	{@const ws = one.data.workspace}
	<Header.Root title={ws.name} eyebrow="Workspace">
		<Header.Item label="Slug">{ws.slug}</Header.Item>
		<Header.Item label="Schema">{ws.schema}</Header.Item>
		<Header.Item label="Status">
			<Badge tone={ws.status === 'ready' ? 'done' : 'pending'}>{ws.status}</Badge>
		</Header.Item>
		<Header.Item label="Access">{one.data.access.length}</Header.Item>
		<Header.Item label="Created">{f.date(ws.timeCreated)}</Header.Item>
	</Header.Root>

	{#if ws.status === 'pending'}
		<Section title="Setup" description="Its schema isn't migrated yet. The job is safe to rerun.">
			{#if again.isError}
				<Issue>{again.error.message}</Issue>
			{/if}
			<div>
				<Button pending={again.isPending} onclick={() => again.mutate({ slug: ws.slug })}>
					Retry setup
				</Button>
			</div>
		</Section>
	{/if}

	<Section divider title="General">
		<GeneralForm workspace={ws} multi={kind.data === 'multi'} />
	</Section>

	<Section divider wide title="Access" description="Who can see it, from central access.">
		{#if one.data.access.length === 0}
			<Empty>Nobody has access.</Empty>
		{:else}
			<ul>
				{#each one.data.access as who (who.userID)}
					<li>
						<a href={`/u/${who.userID}`}>{who.name}</a>
						<span class="dim">{who.email}</span>
						<span class="dim end">since {f.date(who.timeCreated)}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</Section>

	<Section divider wide title="Members" description="Roles, from the workspace's own table.">
		<MembersTable rows={one.data.members} />
	</Section>

	<Section divider wide title="Usage" description="Disk use of its schema, from the catalogs.">
		{#if disk.isError}
			<Issue>{disk.error.message}</Issue>
		{:else if disk.isSuccess}
			{#if disk.data[0]}
				<Usage usage={disk.data[0]} />
			{:else}
				<Empty>Its schema holds no tables yet.</Empty>
			{/if}
		{:else}
			<Skeleton h="8em" />
		{/if}
	</Section>
{:else}
	<Skeleton h="12em" />
{/if}

<style>
	ul {
		display: flex;
		flex-direction: column;
		gap: 0.35em;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.75em;
		padding: 0.5em 0.9em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		font-size: 0.9em;
	}

	a {
		font-weight: 500;
		color: inherit;
	}

	.dim {
		color: var(--muted);
	}

	.end {
		margin-left: auto;
	}
</style>
