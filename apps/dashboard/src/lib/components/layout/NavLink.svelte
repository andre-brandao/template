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
	<!-- The accent only on the link you stand on: "where am I" is the one state a sidebar has. -->
	{#if Icon}<Icon size={16} strokeWidth={1.75} color={at(item) ? 'var(--accent)' : undefined} />{/if}
	{#if !slim}<span class="label">{item.label}</span>{/if}
</a>

<style>
	.navlink {
		display: flex;
		align-items: center;
		gap: 0.625em;
		height: 2.25em;
		padding: 0 0.625em;
		border-radius: var(--radius-sm);
		color: var(--muted);
		font-size: 0.95em;
		text-decoration: none;
	}

	.navlink:hover,
	.navlink[aria-current='page'] {
		color: var(--ink);
		background: var(--hover);
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
		font-weight: 500;
	}

	.navlink[aria-current='page']::before {
		content: '';
		position: absolute;
		inset: 0;
		z-index: -1;
		border-radius: var(--radius-sm);
		/* A raised paper chip on the page-toned rail. */
		background: var(--surface);
		box-shadow:
			0 0 0 1px var(--border),
			var(--shadow-1);
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
