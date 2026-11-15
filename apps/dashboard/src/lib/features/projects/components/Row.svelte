<script lang="ts">
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import type { Project } from '@template/core/project';
	import { Avatar, Inline, Menu, Status, modal } from '@template/ui';
	import LinkForm from '$lib/components/LinkForm.svelte';
	import { fmt } from '$lib/utils/fmt';
	import Ellipsis from '@lucide/svelte/icons/ellipsis';
	import LinkIcon from '@lucide/svelte/icons/link';
	import { link, update } from '../api/projects.query';
	import Delete from './Delete.svelte';

	let { project }: { project: Project.Info } = $props();

	const f = fmt();
	const save = update();
	const attach = link();
	const href = $derived(`/projects/${project.id}`);
	const count = $derived(project.metadata.links.length);
	// The typed name stays up until the refetch lands; a failure falls back to the stored one.
	const name = $derived((save.isPending && save.variables?.body.name) || project.name);
	const mark = $derived(
		save.isPending ? 'pending' : save.isError ? 'failed' : save.isSuccess ? 'saved' : 'idle'
	);

	let renaming = $state(false);
	let anchor: HTMLAnchorElement | undefined;

	async function done() {
		renaming = false;
		await tick();
		anchor?.focus();
	}
</script>

<Delete id={project.id} name={project.name}>
	{#snippet children(ask, deleting)}
		<li class={['row', { deleting }]} aria-busy={deleting}>
			<Avatar name={project.name} image={project.image} size={20} />

			<div class="main">
				{#if renaming}
					<!-- Leaving the field by any route ends the rename; Inline owns the draft. -->
					<div
						class="edit"
						onfocusout={() => (renaming = false)}
						onkeydowncapture={(e) => (e.key === 'Escape' || e.key === 'Enter') && done()}
						{@attach (el) => el.querySelector('button')?.focus()}
					>
						<Inline
							label="Project name"
							value={project.name}
							onsave={(next) => save.mutateAsync({ path: { id: project.id }, body: { name: next } })}
						/>
					</div>
				{:else}
					<span class="title">
						<a class="name" {href} {@attach (el) => { anchor = el; }}>{name}</a>
						<Status
							state={deleting ? 'pending' : mark}
							message={save.error?.message}
						/>
					</span>
				{/if}
				{#if project.description}<p class="blurb">{project.description}</p>{/if}
			</div>

			<span class="meta">
				{#if count}
					<span class="links" aria-label="{count} {count === 1 ? 'link' : 'links'}">
						<LinkIcon size={12} strokeWidth={1.75} />
						{count}
					</span>
				{/if}
				<time datetime={project.timeCreated} title={f.stamp(project.timeCreated)}>
					{f.ago(project.timeCreated)}
				</time>
			</span>

			<Menu.Root label="{project.name} actions" align="end">
				{#snippet trigger(attrs)}
					<button class="dots" aria-label="{project.name} actions" {...attrs}>
						<Ellipsis size={16} strokeWidth={1.75} />
					</button>
				{/snippet}
				<Menu.Item onselect={() => goto(href)}>Open</Menu.Item>
				<Menu.Item disabled={save.isPending || deleting} onselect={() => (renaming = true)}>
					Rename
				</Menu.Item>
				<Menu.Item
					disabled={deleting}
					onselect={() =>
						modal(LinkForm, {
							add: (body: { url: string; title?: string }) =>
								attach.mutateAsync({ path: { id: project.id }, body })
						})}
				>
					Add link
				</Menu.Item>
				<Menu.Separator />
				<Menu.Item danger disabled={deleting} onselect={ask}>Delete</Menu.Item>
			</Menu.Root>
		</li>
	{/snippet}
</Delete>

<style>
	.row {
		position: relative;
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto auto;
		align-items: center;
		gap: 0.75em;
		min-height: 3.25em;
		padding: 0.4em 0.4em 0.4em 0.7em;
		border-bottom: 1px solid var(--border);
		transition:
			background 140ms ease,
			opacity 140ms ease;
	}

	.row:hover,
	.row:focus-within {
		background: var(--hover);
	}

	.deleting {
		opacity: 0.55;
		pointer-events: none;
	}

	.main {
		min-width: 0;
	}

	.title,
	.meta {
		display: flex;
		align-items: center;
	}

	.title {
		gap: 0.5em;
		min-width: 0;
	}

	.name {
		overflow: hidden;
		color: var(--ink);
		font-weight: 500;
		text-decoration: none;
		text-overflow: ellipsis;
		white-space: nowrap;
		outline: none;
	}

	/* Stretched over the row, so anywhere that isn't the menu opens the project. */
	.name::after {
		content: '';
		position: absolute;
		inset: 0;
	}

	.name:focus-visible::after {
		outline: 2px solid var(--accent);
		outline-offset: -2px;
		border-radius: var(--radius-sm);
	}

	/* Inline pads its box; pull it back so the text stays on the name's line. */
	.edit {
		position: relative;
		z-index: 1;
		margin: -0.2em -0.4em;
		font-weight: 500;
	}

	.blurb {
		margin: 0.1em 0 0;
		overflow: hidden;
		color: var(--muted);
		font-size: 0.85em;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.meta {
		gap: 1em;
		color: var(--dim);
		font-size: 0.82em;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.links {
		display: inline-flex;
		align-items: center;
		gap: 0.3em;
	}

	.dots {
		position: relative;
		z-index: 1;
		display: grid;
		place-items: center;
		width: 1.9em;
		height: 1.9em;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		color: var(--muted);
		cursor: pointer;
		opacity: 0;
		transition:
			opacity 140ms ease,
			background 140ms ease;
	}

	.row:hover .dots,
	.row:focus-within .dots,
	.dots[aria-expanded='true'] {
		opacity: 1;
	}

	.dots:hover,
	.dots[aria-expanded='true'] {
		background: var(--hover);
		color: var(--ink);
	}

	.dots:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: -1px;
	}

	@media (hover: none) {
		.dots {
			opacity: 1;
		}
	}

	@media (max-width: 600px) {
		.meta {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.row,
		.dots {
			transition: none;
		}
	}
</style>
