<script lang="ts">
	import { untrack } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import Select, { type Option } from './Select.svelte';

	let {
		load,
		options = [],
		value = '',
		dedupe = false,
		...rest
	}: {
		/** Fetches the remaining options; called once, on first hover/focus. */
		load: () => Promise<Option[]>;
		/** Static options shown before anything is fetched. */
		options?: Option[];
		value?: string | null;
		/** Drop loaded options that repeat a static one — for statics that mirror loadable entries. */
		dedupe?: boolean;
	} & HTMLSelectAttributes = $props();

	let extra = $state.raw<Option[]>([]);
	let pending = false;

	function fetch() {
		if (pending) return;
		pending = true;
		load().then((next) => (extra = next));
	}

	// A preselected value outside the static options has no label until fetched.
	if (untrack(() => value && !options.some((one) => one.value === value))) fetch();
</script>

<Select
	options={[
		...options,
		...(dedupe ? extra.filter((one) => !options.some((o) => o.value === one.value)) : extra)
	]}
	value={value ?? ''}
	{...rest}
	onpointerenter={fetch}
	onfocus={fetch}
/>
