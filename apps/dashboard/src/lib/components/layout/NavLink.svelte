<!-- One sidebar link. `slim` is the collapsed rail: icons stay put and the words fall
     away, so collapsing reads as the same rail narrowing rather than a different menu. -->
<script lang="ts">
	import { resolve } from '$app/paths';
	import { at, type Item } from './nav';

	let { item, slim = false }: { item: Item; slim?: boolean } = $props();

	const Icon = $derived(item.icon);
</script>

<a
	class="navlink"
	class:slim
	href={resolve(item.href as any)}
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
		padding: 0.5em 0.7em;
		border-radius: var(--radius);
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.82em;
		text-decoration: none;
	}

	.navlink:hover,
	.navlink[aria-current='page'] {
		color: var(--ink);
		background: var(--surface-2);
	}

	.slim {
		justify-content: center;
		padding-inline: 0;
	}

	/* The highlight is its own layer, named, so a navigation morphs it from the link you
	   left to the one you land on — the browser tweens the two snapshots, no keyframes.
	   Only one sidebar is ever rendered (the rail hides below 700px, the drawer above it),
	   so the name is claimed once. */
	.navlink[aria-current='page'] {
		position: relative;
		background: none;
	}

	.navlink[aria-current='page']::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		border-radius: var(--radius);
		background: var(--surface-2);
		view-transition-name: active;
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
