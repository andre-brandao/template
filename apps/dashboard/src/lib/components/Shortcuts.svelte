<!-- Static shortcut links: a row of pills, or with `grid` a two-column grid of buttons. -->
<script lang="ts">
	import type { Component } from 'svelte';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';

	let {
		label,
		links,
		grid = false
	}: {
		label: string;
		links: { href: string; label: string; icon?: Component; primary?: boolean }[];
		grid?: boolean;
	} = $props();
</script>

<nav class={['shortcuts', { grid }]} aria-label={label}>
	{#each links as link (link.href)}
		<a href={link.href} class={{ primary: link.primary }}>
			{#if link.icon}<link.icon size={14} aria-hidden="true" />{/if}
			<span class="name">{link.label}</span>
			{#if grid}<i class="arrow"><ChevronRight size={12} aria-hidden="true" /></i>{/if}
		</a>
	{/each}
</nav>

<style>
	.shortcuts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4em;
	}

	a {
		display: flex;
		align-items: center;
		gap: 0.45em;
		padding: 0.3em 0.8em;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--muted);
		font-size: 0.86em;
		text-decoration: none;
	}

	a:hover {
		border-color: var(--border-bright);
		color: var(--ink);
	}

	a.primary {
		border-color: color-mix(in oklab, var(--accent) 45%, transparent);
		color: var(--accent);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.grid a {
		padding: 0.45em 0.6em;
		border-radius: var(--radius);
	}

	.grid a:hover {
		background: var(--hover);
	}

	.grid .name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.arrow {
		display: flex;
		opacity: 0.5;
	}
</style>
