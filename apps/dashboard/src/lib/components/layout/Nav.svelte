<!-- The sidebar's contents: an optional way back out, then the sections of links. Rendered
     twice by the Shell — once in the desktop rail, once in the drawer — which is why
     `slim` is a prop rather than read from the rail's own state: the drawer shows the
     full-width menu even while the rail beside it is collapsed. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import type { Item } from './nav';
	import NavLink from './NavLink.svelte';

	let {
		back,
		sections,
		slim = false
	}: {
		back?: { href: string; label: string };
		sections: { title?: string; items: Item[]; bottom?: boolean }[];
		slim?: boolean;
	} = $props();
</script>

{#if back}
	<a
		class="back"
		class:slim
		href={resolve(back.href as Pathname)}
		data-transition="back"
		title={slim ? back.label : undefined}
	>
		<ArrowLeft size={15} strokeWidth={1.75} />
		{#if !slim}<span class="label">{back.label}</span>{/if}
	</a>
{/if}

<nav>
	{#each sections as section (section.title ?? section.items[0]?.href)}
		<div class="section" class:bottom={section.bottom}>
			{#if section.title && !slim}<span class="title">{section.title}</span>{/if}
			{#each section.items as item (item.href)}
				<NavLink {item} {slim} />
			{/each}
		</div>
	{/each}
</nav>

<style>
	nav {
		display: flex;
		flex-direction: column;
		gap: 1.5em;
		/* Fills the rail so a `bottom` section's auto margin has room to push. */
		flex: 1;
	}

	.bottom {
		margin-top: auto;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
	}

	.title {
		font-family: var(--font-mono);
		font-size: 0.68em;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--dim);
		padding: 0 0.7em;
		margin-bottom: 0.35em;
	}

	.back {
		display: flex;
		align-items: center;
		gap: 0.6em;
		font-family: var(--font-mono);
		font-size: 0.82em;
		color: var(--muted);
		text-decoration: none;
		padding: 0 0.7em;
	}

	.back:hover {
		color: var(--ink);
	}

	.slim {
		justify-content: center;
		padding-inline: 0;
	}

	.label {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
