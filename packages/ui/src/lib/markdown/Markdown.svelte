<script lang="ts">
	import { parseMarkdown } from '@tanstack/markdown';
	import Block from './render/Block.svelte';
	import type { Components } from './render/types';
	import './markdown.css';

	let { value, components }: { value: string; components?: Components } = $props();

	const doc = $derived(parseMarkdown(value));
</script>

<div class="markdown-body">
	{#each doc.children as node, i (i)}
		<Block {node} {components} />
	{/each}
</div>
