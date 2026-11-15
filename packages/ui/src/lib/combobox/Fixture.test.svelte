<script lang="ts">
	import Combobox from './Combobox.svelte';

	let {
		items,
		value = $bindable('a'),
		open = $bindable(false)
	}: { items: { id: string; name: string; kind: string }[]; value?: string; open?: boolean } =
		$props();
</script>

<Combobox
	{items}
	key={(one) => one.id}
	text={(one) => one.name}
	group={(one) => one.kind}
	facet={(one) => one.kind}
	bind:value
	bind:open
	label="Pick"
/>
