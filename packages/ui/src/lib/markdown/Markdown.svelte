<script lang="ts">
	import { parseMarkdown } from '@tanstack/markdown';
	import Block from './render/Block.svelte';
	import type { Components } from './render/types';
	import './markdown.css';

	// `html` keeps raw html nodes in the tree; without a `components.html` override they still
	// render escaped, so turning it on alone changes nothing visible.
	let {
		value,
		components,
		html = false
	}: { value: string; components?: Components; html?: boolean } = $props();

	const doc = $derived(parseMarkdown(value, { allowHtml: html }));
</script>

<div class="markdown-body">
	{#each doc.children as node, i (i)}
		<Block {node} {components} />
	{/each}
</div>
