<!-- The signed-in home. The route composes the widget bodies, so this slice imports no other.
     `frame` lets the route wrap the layouts (an A/B test, say); it gets the props and heading. -->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Permission } from '@template/core/permission';
	import { page, type Key, type Props, type Widget } from '../modules';
	import { layouts } from '../layouts';

	let {
		name,
		role,
		widgets,
		frame
	}: {
		name: string;
		role: Permission.Role;
		widgets: Record<Key, Omit<Widget, 'key'>>;
		frame?: Snippet<[Props, Snippet]>;
	} = $props();

	const home = $derived(page(role, widgets));
	const Layout = layouts.current.component;
</script>

{#snippet heading()}<h1>Welcome back, {name}.</h1>{/snippet}

<div class="home">
	{#if frame}
		{@render frame(home, heading)}
	{:else}
		{@render heading()}
		<Layout {...home} />
	{/if}
</div>

<style>
	.home {
		display: flex;
		flex-direction: column;
		gap: 1.2em;
	}

	h1 {
		margin: 0;
		font-size: 1.5em;
	}
</style>
