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
		html = false,
		caret = false
	}: {
		value: string;
		components?: Components;
		html?: boolean;
		/** A blinking caret after the text, for a stream; CSS draws it, so a blink never re-parses. */
		caret?: boolean;
	} = $props();

	const doc = $derived(parseMarkdown(value, { allowHtml: html }));
</script>

<div class={['markdown-body', { caret }]}>
	{#each doc.children as node, i (i)}
		<Block {node} {components} />
	{/each}
</div>
