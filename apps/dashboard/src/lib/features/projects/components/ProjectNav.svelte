<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Avatar, Combobox, Tooltip } from '@template/ui';
	import { createQuery } from '@tanstack/svelte-query';
	import { list } from '../api/projects.query';

	let { id, tight = false }: { id: string; tight?: boolean } = $props();

	const projects = createQuery(() => list());
	const current = $derived(projects.data?.data.find((p) => p.id === id));
	const label = $derived(current?.name ?? 'Project');
	// Keep the reader on the same subpage when they switch projects.
	const sub = $derived(page.url.pathname.slice(`/projects/${id}`.length));
</script>

{#if projects.isPending}
	<span class="ph" class:tight></span>
{:else}
<div class="switcher" class:tight>
	<Combobox
		items={projects.data?.data ?? []}
		key={(p) => p.id}
		text={(p) => p.name}
		value={id}
		label="Projects"
		placeholder="Find a project"
		caret={!tight}
		onchange={(next) => goto(`/projects/${next}${sub}`)}
	>
		{#snippet trigger()}
			{#if tight}
				<Tooltip tip={label} side="right">
					<!-- Collapsed the avatar is all that is left, and Avatar falls back to an
					     initial when there is no image. -->
					<Avatar name={label} image={current?.image} size={16} />
				</Tooltip>
			{:else}
				<Avatar name={label} image={current?.image} size={16} />
				<span class="name">{label}</span>
			{/if}
		{/snippet}
		{#snippet item(p, row)}
			<Avatar name={p.name} image={p.image} size={16} />
			<span class="name">{@render row.marked(p.name)}</span>
		{/snippet}
		{#snippet empty()}{projects.error?.message ?? 'No project by that name.'}{/snippet}
	</Combobox>
</div>
{/if}

<style>
	.switcher {
		flex: 1;
		min-width: 0;
	}

	/* Down to the avatar and its frame — the name lives in the tooltip and in the
	   list that drops out of it. */
	.tight {
		flex: 0 0 auto;
	}

	.ph {
		display: block;
		flex: 1;
		min-width: 0;
		height: 2em;
		border-radius: var(--radius);
		background: var(--surface-2);
	}

	/* Matches the collapsed switcher's footprint so the corner doesn't jump. */
	.ph.tight {
		flex: 0 0 2em;
		border-radius: 50%;
	}

	.name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
