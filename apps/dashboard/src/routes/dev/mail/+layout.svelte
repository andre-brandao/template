<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import Nav from '../Nav.svelte';

	let { data, children } = $props();

	const items = $derived(
		data.mails.map((one) => ({
			href: resolve('/dev/mail/[name]', { name: one.name }),
			label: one.label,
			active: page.params.name === one.name
		}))
	);
</script>

<Nav label="Templates" {items} {children} tall />
