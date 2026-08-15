<script lang="ts">
	import { page } from '$app/state';
	import { Combobox, Tooltip } from '@template/ui';
	import Avatar from '$lib/components/Avatar.svelte';
	import { getProjects } from '../api/projects.remote';

	let { id, tight = false }: { id: string; tight?: boolean } = $props();

	const projects = $derived(await getProjects({}));
	const current = $derived(projects.find((p) => p.id === id));
	const label = $derived(current?.name ?? 'Project');
	// Keep the reader on the same subpage when they switch projects.
	const sub = $derived(page.url.pathname.slice(`/projects/${id}`.length));
</script>

<div class="switcher" class:tight>
	<Combobox.Root value={id}>
		<Combobox.Trigger caret={!tight}>
			{#if tight}
				<Tooltip tip={label} side="right">
					<!-- Collapsed the avatar is all that is left, and Avatar falls back to an
					     initial when there is no image. -->
					<Avatar name={label} image={current?.image ?? null} size={16} />
				</Tooltip>
			{:else}
				<Avatar name={label} image={current?.image ?? null} size={16} />
				<span class="name">{label}</span>
			{/if}
		</Combobox.Trigger>

		<Combobox.Content title="Projects">
			<Combobox.Search placeholder="Find a project" />
			<Combobox.List label="Projects">
				{#each projects as p (p.id)}
					<Combobox.Item value={p.id} label={p.name} href="/projects/{p.id}{sub}">
						{#if p.image}
							<Avatar name={p.name} image={p.image} size={16} />
						{/if}
						<span class="name">{p.name}</span>
					</Combobox.Item>
				{/each}
			</Combobox.List>
			<Combobox.Empty>No project by that name.</Combobox.Empty>
		</Combobox.Content>
	</Combobox.Root>
</div>

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

	.name {
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
