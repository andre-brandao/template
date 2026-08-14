<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { BlockNode, FootnoteItemNode } from '@tanstack/markdown';

	// `block` arrives as a snippet rather than an import so the renderer stays a tree, not a cycle.
	let { items, block }: { items: FootnoteItemNode[]; block: Snippet<[BlockNode]> } = $props();

	const label = (item: FootnoteItemNode, i: number) =>
		i === 0 ? `${item.number}` : `${item.number}-${i + 1}`;
</script>

<section data-footnotes class="footnotes">
	<h2 id="footnote-label" class="sr-only">Footnotes</h2>
	<ol>
		{#each items as item (item.id)}
			<li id="user-content-fn-{item.id}">
				{#each item.children as kid, i (i)}
					{@render block(kid)}
				{/each}
				<p class="backrefs">
					{#each { length: item.referenceCount ?? 1 }, i}
						<a
							data-footnote-backref
							class="data-footnote-backref"
							aria-label="Back to reference {label(item, i)}"
							href="#user-content-fnref-{i === 0 ? item.id : `${item.id}-${i + 1}`}">&#8617;</a
						>
					{/each}
				</p>
			</li>
		{/each}
	</ol>
</section>
