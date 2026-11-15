<!-- Cosmetic; core re-checks every grant. `owner` (a row's `createdBy`) enables `:own` grants. -->
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
