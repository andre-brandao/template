<script lang="ts">
	import { resolve } from '$app/paths';

	let { items }: { items: { href?: string; label: string }[] } = $props();
</script>

<nav aria-label="Breadcrumb">
	<ol>
		{#each items as item, i (`${item.href ?? ''}:${item.label}`)}
			<li>
				{#if item.href && i < items.length - 1}
					<a href={resolve(item.href as any)}>{item.label}</a>
				{:else}
					<span aria-current={i === items.length - 1 ? 'page' : undefined}>{item.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	nav {
		display: flex;
		align-items: center;
		flex: 1;
		min-width: 0;
	}

	ol {
		display: flex;
		align-items: center;
		gap: 0.5em;
		min-width: 0;
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.93em;
		color: var(--dim);
	}

	li {
		display: flex;
		align-items: center;
		gap: 0.5em;
		min-width: 0;
	}

	li + li::before {
		content: '/';
		color: var(--border-bright);
	}

	a,
	span {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	a {
		color: var(--muted);
		text-decoration: none;
	}

	a:hover {
		color: var(--ink);
	}

	[aria-current='page'] {
		color: var(--ink);
	}

	/* The phone bar also holds the menu, brand and switcher, which leaves a crumb one letter
	   wide; the page's own heading names it instead. */
	@media (max-width: 700px) {
		nav {
			display: none;
		}
	}
</style>
