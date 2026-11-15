<script lang="ts">
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
	<Combobox.Root value={id}>
		<Combobox.Trigger caret={!tight}>
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
		</Combobox.Trigger>

		<Combobox.Content title="Projects">
			<Combobox.Search placeholder="Find a project" />
			<Combobox.List label="Projects">
				{#each projects.data?.data ?? [] as p (p.id)}
					<Combobox.Item value={p.id} label={p.name} href="/projects/{p.id}{sub}">
						<Avatar name={p.name} image={p.image} size={16} />
						<span class="name">{p.name}</span>
					</Combobox.Item>
				{/each}
			</Combobox.List>
			<Combobox.Empty>{projects.error?.message ?? 'No project by that name.'}</Combobox.Empty>
		</Combobox.Content>
	</Combobox.Root>
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
