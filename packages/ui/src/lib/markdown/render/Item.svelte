<script lang="ts">
	import type { InlineNode, ListItemNode } from '@tanstack/markdown';
	import type { Components } from './types';
	import Block from './Block.svelte';
	import Inline from './Inline.svelte';

	let {
		item,
		loose,
		components
	}: { item: ListItemNode; loose?: boolean; components?: Components } = $props();

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
			<Block node={child} {components} />
		{/if}
	{/each}
</li>
