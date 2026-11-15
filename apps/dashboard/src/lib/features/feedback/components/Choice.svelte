<!--
	A segmented pick for a remote form: Tabs for the look, a hidden field for the value.
	Arrow keys move the pick, as in any radio group.
-->
<script lang="ts" generics="T extends string">
	import type { RemoteFormField } from '@sveltejs/kit';
	import { Tabs } from '@template/ui';

	let {
		field,
		options,
		fallback,
		label
	}: {
		field: RemoteFormField<string>;
		options: { value: T; label: string; hint?: string }[];
		fallback: T;
		label: string;
	} = $props();

	// Writable: it starts at the fallback and then follows the pick.
	let current = $derived(fallback);

	function keys(e: KeyboardEvent & { currentTarget: HTMLElement }) {
		const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
		if (!step) return;
		e.preventDefault();
		const at = options.findIndex((option) => option.value === current);
		const next = (at + step + options.length) % options.length;
		current = options[next].value;
		e.currentTarget.querySelectorAll<HTMLElement>('[role="radio"]')[next]?.focus();
	}
</script>

<Tabs.Root role="radiogroup" aria-label={label} onkeydown={keys}>
	{#each options as option (option.value)}
		{@const on = option.value === current}
		<Tabs.Item
			role="radio"
			aria-checked={on}
			tabindex={on ? 0 : -1}
			active={on}
			title={option.hint}
			onclick={() => (current = option.value)}
		>
			{option.label}
		</Tabs.Item>
	{/each}
</Tabs.Root>
<input {...field.as('hidden', current)} />
