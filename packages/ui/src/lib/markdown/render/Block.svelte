<script lang="ts">
	import type { BlockNode, InlineNode } from '@tanstack/markdown';
	import type { Components } from './types';
	import Self from './Block.svelte';
	import Code from '../../ui/Code.svelte';
	import Inline from './Inline.svelte';
	import Item from './Item.svelte';

	let { node, components }: { node: BlockNode; components?: Components } = $props();
</script>

{#snippet inlines(nodes: InlineNode[])}
	{#each nodes as kid, i (i)}
		<Inline node={kid} {components} />
	{/each}
{/snippet}

{#snippet blocks(nodes: BlockNode[])}
	{#each nodes as kid, i (i)}
		<Self node={kid} {components} />
	{/each}
{/snippet}

{#if node.type === 'paragraph'}
	<p>{@render inlines(node.children)}</p>
{:else if node.type === 'heading'}
	<svelte:element this={`h${node.depth}`} id={node.id}>{@render inlines(node.children)}</svelte:element>
{:else if node.type === 'code'}
	{#if components?.code}
		{@const C = components.code}
		<C value={node.value} lang={node.lang} title={node.title} />
	{:else}
		<Code value={node.value} lang={node.lang} title={node.title} />
	{/if}
{:else if node.type === 'list'}
	{#if node.ordered}
		<ol start={node.start && node.start !== 1 ? node.start : undefined}>
			{#each node.items as item, i (i)}
				<Item {item} loose={node.loose} {components} />
			{/each}
		</ol>
	{:else}
		<ul>
			{#each node.items as item, i (i)}
				<Item {item} loose={node.loose} {components} />
			{/each}
		</ul>
	{/if}
{:else if node.type === 'blockquote'}
	<blockquote>{@render blocks(node.children)}</blockquote>
{:else if node.type === 'table'}
	<table>
		<thead>
			<tr>
				{#each node.header as cell, i (i)}
					<th style:text-align={node.align[i]}>{@render inlines(cell.children)}</th>
				{/each}
			</tr>
		</thead>
		{#if node.rows.length}
			<tbody>
				{#each node.rows as row, r (r)}
					<tr>
						{#each row as cell, i (i)}
							<td style:text-align={node.align[i]}>{@render inlines(cell.children)}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		{/if}
	</table>
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
	<section data-footnotes class="footnotes">
		<h2 id="footnote-label" class="sr-only">Footnotes</h2>
		<ol>
			{#each node.items as item (item.id)}
				<li id="user-content-fn-{item.id}">
					{@render blocks(item.children)}
					<p class="backrefs">
						{#each { length: item.referenceCount ?? 1 }, i}
							{@const ref = i === 0 ? item.id : `${item.id}-${i + 1}`}
							<a
								data-footnote-backref
								class="data-footnote-backref"
								aria-label="Back to reference {i === 0 ? item.number : `${item.number}-${i + 1}`}"
								href="#user-content-fnref-{ref}">&#8617;</a
							>
						{/each}
					</p>
				</li>
			{/each}
		</ol>
	</section>
{/if}
