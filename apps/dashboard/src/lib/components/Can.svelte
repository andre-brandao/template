<!--
	Renders its children only when the signed-in user holds every listed grant.

	Cosmetic only — core runs the same check again on the way through the mutation, so a
	missing `<Can>` is a UI papercut, never a hole. Pass `owner` (a row's `createdBy`) to
	let the role's `:own` grants apply; the comparison against the current user happens
	here so call sites stay declarative.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Permission } from '@template/core/permission';
	import { user } from '$lib/utils/context';

	let {
		grants,
		owner,
		children,
		fallback
	}: {
		grants: Permission.Grants;
		owner?: string;
		children: Snippet;
		fallback?: Snippet;
	} = $props();

	const me = user();
	const ok = $derived(me.can(grants, !!owner && owner === me.current?.id));
</script>

{#if ok}
	{@render children()}
{:else if fallback}
	{@render fallback()}
{/if}
