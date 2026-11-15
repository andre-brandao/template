<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		boxed = false,
		children
	}: {
		/** Names the list for assistive tech: "Projects", "API keys". */
		label?: string;
		/** A bordered card, for a list inside a `Section`; a page-level list stays flat. */
		boxed?: boolean;
		children: Snippet;
	} = $props();

	// Arrows walk rows; a field inside a row (a rename) keeps its own arrow keys.
	function keys(e: KeyboardEvent & { currentTarget: HTMLElement }) {
		const from = e.target as HTMLElement;
		if (e.altKey || e.ctrlKey || e.metaKey || from.closest('input, textarea, select, [contenteditable]')) return;
		const rows = [...e.currentTarget.querySelectorAll<HTMLElement>(':scope > [data-row]')];
		const at = rows.findIndex((row) => row.contains(from));
		const to = { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: rows.length - 1 }[e.key];
		if (at === -1 || to === undefined) return;
		e.preventDefault();
		rows[Math.max(0, Math.min(to, rows.length - 1))]
			.querySelector<HTMLElement>('[data-target], a[href], button:not(:disabled)')
			?.focus();
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<ul class={['list', { boxed }]} aria-label={label} onkeydown={keys}>
	{@render children()}
</ul>

<style>
	.list {
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.boxed {
		overflow: hidden;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
	}
</style>
