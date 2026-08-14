<script lang="ts">
	import type { InlineNode, TableNode } from '@tanstack/markdown';
	import type { Components } from './types';
	import Inline from './Inline.svelte';

	let { node, components }: { node: TableNode; components?: Components } = $props();
</script>

{#snippet inlines(nodes: InlineNode[])}
	{#each nodes as kid, i (i)}
		<Inline node={kid} {components} />
	{/each}
{/snippet}

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
