<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { BlockNode, InlineNode, ListItemNode } from '@tanstack/markdown';
	import type { Components } from './types';
	import Inline from './Inline.svelte';

	// `block` arrives as a snippet rather than an import so the renderer stays a tree, not a cycle.
	let {
		item,
		loose,
		components,
		block
	}: {
		item: ListItemNode;
		loose?: boolean;
		components?: Components;
		block: Snippet<[BlockNode]>;
	} = $props();

	// A tight item's leading paragraph renders bare, so the bullet stays on one line.
	const lead = $derived(item.children[0]?.type === 'paragraph' ? item.children[0] : undefined);
	const rest = $derived(lead ? item.children.slice(1) : item.children);
</script>

{#snippet inlines(nodes: InlineNode[])}
	{#each nodes as node, i (i)}
		<Inline {node} {components} />
	{/each}
{/snippet}

<li class={item.checked === undefined ? undefined : 'task'}>
	{#if item.checked !== undefined}
		<input type="checkbox" checked={item.checked} disabled />
	{/if}
	{#if lead}
		{#if loose}
			<p>{@render inlines(lead.children)}</p>
		{:else}
			{@render inlines(lead.children)}
		{/if}
	{/if}
	{#each rest as child, i (i)}
		{#if !loose && child.type === 'paragraph'}
			{@render inlines(child.children)}
		{:else}
			{@render block(child)}
		{/if}
	{/each}
</li>
