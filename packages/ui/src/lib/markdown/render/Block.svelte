<!-- fallow-ignore-file complexity -- flat dispatch over the block node union; branches are node types, not logic. -->
<script lang="ts">
	import type { BlockNode, InlineNode } from '@tanstack/markdown';
	import type { Components } from './types';
	import Fence from '../Fence.svelte';
	import Self from './Block.svelte';
	import Footnotes from './Footnotes.svelte';
	import Inline from './Inline.svelte';
	import Item from './Item.svelte';
	import Table from './Table.svelte';

	let { node, components }: { node: BlockNode; components?: Components } = $props();
</script>

{#snippet inlines(nodes: InlineNode[])}
	{#each nodes as kid, i (i)}
		<Inline node={kid} {components} />
	{/each}
{/snippet}

{#snippet one(kid: BlockNode)}
	<Self node={kid} {components} />
{/snippet}

{#snippet blocks(nodes: BlockNode[])}
	{#each nodes as kid, i (i)}
		<Self node={kid} {components} />
	{/each}
{/snippet}

{#if node.type === 'paragraph'}
	<p>{@render inlines(node.children)}</p>
{:else if node.type === 'heading'}
	<svelte:element this={`h${node.depth}`} id={node.id}>
		{@render inlines(node.children)}
	</svelte:element>
{:else if node.type === 'code'}
	{@const C = components?.code ?? Fence}
	<C value={node.value} lang={node.lang} title={node.title} />
{:else if node.type === 'list'}
	<svelte:element
		this={node.ordered ? 'ol' : 'ul'}
		start={node.ordered && node.start !== 1 ? node.start : undefined}
	>
		{#each node.items as item, i (i)}
			<Item {item} loose={node.loose} {components} block={one} />
		{/each}
	</svelte:element>
{:else if node.type === 'blockquote'}
	<blockquote>{@render blocks(node.children)}</blockquote>
{:else if node.type === 'table'}
	<Table {node} {components} />
{:else if node.type === 'thematicBreak'}
	<hr />
{:else if node.type === 'html'}
	<p>{node.value}</p>
{:else if node.type === 'callout'}
	<div class="markdown-alert markdown-alert-{node.kind.toLowerCase()}">
		<p class="markdown-alert-title">{node.title}</p>
		<div class="markdown-alert-content">{@render blocks(node.children)}</div>
	</div>
{:else if node.type === 'component'}
	{@render blocks(node.children)}
{:else if node.type === 'footnotes'}
	<Footnotes items={node.items} block={one} />
{/if}
