<script lang="ts">
	import type { InlineNode } from '@tanstack/markdown';
	import type { Components } from './types';
	import Self from './Inline.svelte';

	let { node, components }: { node: InlineNode; components?: Components } = $props();

	// href/src are already protocol-filtered by the parser's sanitizeUrl.
	const ext = (href: string) =>
		/^https?:/i.test(href) ? { rel: 'noopener noreferrer', target: '_blank' } : {};
</script>

{#snippet kids(nodes: InlineNode[])}
	{#each nodes as kid, i (i)}
		<Self node={kid} {components} />
	{/each}
{/snippet}

{#if node.type === 'text'}
	{node.value}
{:else if node.type === 'inlineHtml'}
	{node.value}
{:else if node.type === 'inlineCode'}
	<code>{node.value}</code>
{:else if node.type === 'strong'}
	<strong>{@render kids(node.children)}</strong>
{:else if node.type === 'emphasis'}
	<em>{@render kids(node.children)}</em>
{:else if node.type === 'strike'}
	<del>{@render kids(node.children)}</del>
{:else if node.type === 'break'}
	<br />
{:else if node.type === 'link'}
	{#if components?.a}
		{@const A = components.a}
		<A href={node.href} title={node.title}>{@render kids(node.children)}</A>
	{:else}
		<a href={node.href} title={node.title} {...ext(node.href)}>{@render kids(node.children)}</a>
	{/if}
{:else if node.type === 'image' && node.src}
	{#if components?.img}
		{@const Img = components.img}
		<Img src={node.src} alt={node.alt} title={node.title} />
	{:else}
		<img src={node.src} alt={node.alt} title={node.title} loading="lazy" />
	{/if}
{:else if node.type === 'footnoteReference'}
	{@const ref = node.referenceIndex && node.referenceIndex > 1 ? `${node.id}-${node.referenceIndex}` : node.id}
	<sup>
		<a
			id="user-content-fnref-{ref}"
			data-footnote-ref
			aria-describedby="footnote-label"
			href="#user-content-fn-{node.id}">{node.number}</a
		>
	</sup>
{/if}
