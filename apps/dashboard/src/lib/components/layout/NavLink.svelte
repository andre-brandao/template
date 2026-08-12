<!-- One sidebar link. `slim` is the collapsed rail: icons stay put and the words fall
     away, so collapsing reads as the same rail narrowing rather than a different menu. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Pathname } from '$app/types';
	import { at, type Item } from './nav';

	let { item, slim = false }: { item: Item; slim?: boolean } = $props();

	const Icon = $derived(item.icon);
</script>

<a
	class="navlink"
	class:slim
	href={resolve(item.href as Pathname)}
	aria-current={at(item)}
	title={slim ? item.label : undefined}
>
	{#if Icon}<Icon size={16} strokeWidth={1.75} />{/if}
	{#if !slim}<span class="label">{item.label}</span>{/if}
</a>

<style>
	.navlink {
		display: flex;
		align-items: center;
		gap: 0.6em;
		font-family: var(--font-mono);
		font-size: 0.82em;
	}

	.slim {
		justify-content: center;
		padding-inline: 0;
	}

	/* The label carries the whole width of an expanded link, so it must not shrink
	   the icon when a name runs long. */
	.label {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
