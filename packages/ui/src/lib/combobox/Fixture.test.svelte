<script lang="ts">
	import * as Combobox from './index';

	let { items, value = 'a' }: { items: { id: string; name: string }[]; value?: string } = $props();
</script>

<Combobox.Root bind:value>
	<Combobox.Trigger>pick</Combobox.Trigger>
	<Combobox.Content>
		<Combobox.Search />
		<Combobox.List>
			{#each items as item (item.id)}
				<Combobox.Item value={item.id} label={item.name}>{item.name}</Combobox.Item>
			{/each}
		</Combobox.List>
		<Combobox.Empty>Nothing matches.</Combobox.Empty>
	</Combobox.Content>
</Combobox.Root>
