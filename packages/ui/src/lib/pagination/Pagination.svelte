<script lang="ts">
	import Button from '../input/Button.svelte';

	/** Structurally a core `Common.Page(...)` result, minus the rows it carries. */
	type Page = { page: number; pageSize: number; total: number };

	let {
		of,
		onchange,
		label = 'entries'
	}: { of: Page; onchange: (page: number) => void; label?: string } = $props();

	const pages = $derived(Math.max(1, Math.ceil(of.total / of.pageSize)));
	// The server's page number is whatever the caller asked for, which after a filter change
	// can briefly exceed the new total — clamp rather than render a negative window.
	const at = $derived(Math.min(Math.max(of.page, 1), pages));
	const from = $derived(of.total === 0 ? 0 : (at - 1) * of.pageSize + 1);
	const to = $derived(Math.min(at * of.pageSize, of.total));

	// Bounds live here so a call site can hand over a bare setter.
	const go = (next: number) => onchange(Math.min(Math.max(next, 1), pages));
</script>

<!-- Nothing to page through is not worth a control; hiding here rather than at each call
     site is the point of the component. -->
{#if pages > 1}
	<nav aria-label="Pagination">
		<Button disabled={at <= 1} onclick={() => go(at - 1)}>Previous</Button>
		<span>
			{from.toLocaleString()}–{to.toLocaleString()} of {of.total.toLocaleString()}
			{label}
		</span>
		<Button disabled={at >= pages} onclick={() => go(at + 1)}>Next</Button>
	</nav>
{/if}

<style>
	nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
		margin-top: 1em;
		padding-top: 1em;
		border-top: 1px solid var(--border, #333);
		font-size: 0.9em;
		color: var(--muted, #888);
	}

	span {
		font-variant-numeric: tabular-nums;
		text-align: center;
	}
</style>
