<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Project } from '@template/core/project';
	import { Avatar, List, Menu, modal } from '@template/ui';
	import LinkForm from '#lib/components/LinkForm.svelte';
	import Rename from '#lib/components/Rename.svelte';
	import { ask } from '#lib/ask.ts';
	import { fmt } from '#lib/utils/fmt.ts';
	import LinkIcon from '@lucide/svelte/icons/link';
	import { link, remove, update } from '../api/projects.query';

	let { project }: { project: Project.Info } = $props();

	const f = fmt();
	const save = update();
	const attach = link();
	const drop = remove();
	const href = $derived(`/projects/${project.id}`);
	const count = $derived(project.metadata.links.length);

	let renaming = $state(false);
	// While renaming, Inline shows its own failure.
	const fail = $derived(drop.error ?? (renaming ? null : save.error));

	async function del() {
		const ok = await ask({
			title: 'Delete project',
			name: project.name,
			warn: 'This removes {name} with its stages and insights. Its todos are kept.',
			verify: true
		});
		if (ok) drop.mutate({ path: { id: project.id } });
	}
</script>

{#snippet rename()}
	<Rename
		label="Project name"
		value={project.name}
		save={(name) => save.mutateAsync({ path: { id: project.id }, body: { name } })}
		done={() => (renaming = false)}
	/>
{/snippet}

<List.Row
	title={renaming ? rename : project.name}
	href={renaming ? undefined : href}
	label="{project.name} actions"
	muted={drop.isPending}
	state={drop.isPending ? 'pending' : fail ? 'failed' : 'idle'}
	message={fail?.message}
>
	{#snippet lead()}<Avatar name={project.name} image={project.image} size={20} />{/snippet}
	{#if project.description}{project.description}{/if}
	{#snippet meta()}
		{#if count}
			<span class="links" aria-label="{count} {count === 1 ? 'link' : 'links'}">
				<LinkIcon size={12} strokeWidth={1.75} />
				{count}
			</span>
		{/if}
		<time datetime={project.timeCreated} title={f.stamp(project.timeCreated)}>
			{f.ago(project.timeCreated)}
		</time>
	{/snippet}
	{#snippet menu()}
		<Menu.Item onselect={() => goto(href)}>Open</Menu.Item>
		<Menu.Item disabled={save.isPending} onselect={() => (renaming = true)}>Rename</Menu.Item>
		<Menu.Item
			onselect={() =>
				modal(LinkForm, {
					add: (body: { url: string; title?: string }) =>
						attach.mutateAsync({ path: { id: project.id }, body })
				})}
		>
			Add link
		</Menu.Item>
		<Menu.Separator />
		<Menu.Item danger onselect={del}>Delete</Menu.Item>
	{/snippet}
</List.Row>

<style>
	.links {
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
	}
</style>
