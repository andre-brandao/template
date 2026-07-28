<script lang="ts">
	import { Button } from '@template/ui';

	let {
		page,
		pages,
		onpage
	}: { page: number; pages: number; onpage: (page: number) => void } = $props();
</script>

{#if pages > 1}
	<div class="pager">
		{#if page > 1}
			<Button variant="ghost" onclick={() => onpage(page - 1)}>Prev</Button>
		{/if}
		<span>Page {page} of {pages}</span>
		{#if page < pages}
			<Button variant="ghost" onclick={() => onpage(page + 1)}>Next</Button>
		{/if}
	</div>
{/if}

<style>
	.pager {
		display: flex;
		align-items: center;
		gap: 0.75em;
		margin-top: 1em;
		color: var(--muted);
		font-family: var(--font-mono);
		font-size: 0.82em;
	}
</style>
