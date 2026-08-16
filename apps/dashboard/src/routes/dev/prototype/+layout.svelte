<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Nav from '../Nav.svelte';

	let { data, children } = $props();

	// The search carries the open doc, so switching feature keeps the tab where it exists.
	const items = $derived(
		data.features.map((one) => ({
			href: resolve('/dev/prototype/[feature]', { feature: one.name }) + page.url.search,
			label: one.title,
			active: page.params.feature === one.name
		}))
	);
</script>

<Nav label="Prototypes" {items} {children} tall />
