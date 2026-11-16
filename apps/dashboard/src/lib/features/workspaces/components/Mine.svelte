<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query';
	import { Badge, Button, Empty, Issue, Skeleton } from '@template/ui';
	import { choose, mine } from '../api/workspaces.query';

	// `current` is the slug the request runs in, so its row shows as the one you're in.
	let { current }: { current?: string } = $props();

	const list = createQuery(mine);
	const pick = choose();
</script>

{#if list.isError}
	<Issue>{list.error.message}</Issue>
{:else if list.isSuccess}
	{#if list.data.length === 0}
		<Empty>You aren't in any workspace yet.</Empty>
	{:else}
		{#if pick.isError}
			<Issue>{pick.error.message}</Issue>
		{/if}
		<ul>
			{#each list.data as one (one.id)}
				<li>
					<span class="name">{one.name}</span>
					<span class="slug">{one.slug}</span>
					{#if one.status === 'pending'}
						<Badge tone="pending">setting up</Badge>
					{/if}
					<span class="end">
						{#if one.slug === current}
							<Badge tone="accent">current</Badge>
						{:else}
							<Button
								disabled={one.status !== 'ready'}
								pending={pick.isPending && pick.variables?.slug === one.slug}
								onclick={() => pick.mutate({ slug: one.slug })}>Switch</Button
							>
						{/if}
					</span>
				</li>
			{/each}
		</ul>
	{/if}
{:else}
	<Skeleton h="6em" />
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
	}

	.name {
		font-weight: 500;
	}

	.slug {
		font-family: var(--font-mono);
		font-size: 0.85em;
		color: var(--muted);
	}

	.end {
		margin-left: auto;
	}
</style>
