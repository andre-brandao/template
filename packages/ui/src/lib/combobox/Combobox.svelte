<!--
	The root: owns open state, the query every item filters itself against, and the
	breakpoint that decides whether the content is a popover or a bottom sheet.
	Everything below it reads that through context, so a call site composes the parts
	in whatever order it needs.
-->
<script lang="ts">
	import { untrack, type Snippet } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { createCombobox } from './ctx.svelte';

	let {
		value = $bindable(),
		open = $bindable(false),
		narrow = '(max-width: 640px)',
		onpick,
		children
	}: {
		/** The selected item's value — marks it in the list. */
		value?: string;
		open?: boolean;
		/** Under this the content leaves the popover and comes up as a drawer. */
		narrow?: string;
		onpick?: (value: string) => void;
		children: Snippet;
	} = $props();

	const media = $derived(new MediaQuery(narrow));
	const id = $props.id();

	let query = $state('');
	let count = $state(0);
	let el: HTMLDivElement | undefined = $state();

	function set(next: boolean) {
		open = next;
		// A stale query would hide most of the list the next time it opens.
		if (!next) query = '';
	}

	createCombobox({
		get open() {
			return open;
		},
		get query() {
			return query;
		},
		get value() {
			return value;
		},
		get narrow() {
			return media.current;
		},
		get count() {
			return count;
		},
		id,
		set,
		search: (next) => (query = next),
		pick: (next) => {
			value = next;
			set(false);
			onpick?.(next);
		},
		// Untracked: an item's effect writes the tally, and reading it there would make
		// that effect depend on what it just wrote.
		tally: (by) => untrack(() => (count += by)),
		match: (text) => text.toLowerCase().includes(query.trim().toLowerCase())
	});
</script>

<!-- Pointerdown rather than focusout: an item is a click target that may never take
     focus, and blurring to nothing would tear the list down before the click lands. -->
<svelte:window onpointerdown={(e) => open && !el?.contains(e.target as Node) && set(false)} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="combobox" bind:this={el} onkeydown={(e) => e.key === 'Escape' && set(false)}>
	{@render children()}
</div>

<style>
	.combobox {
		position: relative;
		min-width: 0;
	}
</style>
