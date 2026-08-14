<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { stories } from '@template/ui/story';
	import Nav from '../Nav.svelte';

	let { children } = $props();

	// The search carries the open tab, so switching component keeps the view.
	const items = $derived(
		stories.map((entry) => ({
			href: resolve('/dev/story/[name]', { name: entry.slug }) + page.url.search,
			label: entry.story.title,
			active: page.params.name === entry.slug
		}))
	);
</script>

<Nav label="Components" {items} {children} tall />
