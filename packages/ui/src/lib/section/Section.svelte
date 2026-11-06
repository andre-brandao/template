<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		description,
		children,
		danger = false,
		divider = false,
		wide = false
	}: {
		title: string;
		description?: string | Snippet;
		children: Snippet;
		danger?: boolean;
		/** Separate this section from the preceding content. */
		divider?: boolean;
		/** Title above, content across the full width, for content that needs room side by side. */
		wide?: boolean;
	} = $props();

	const id = $props.id();
</script>

<section class={['section', { danger, divider, wide }]} aria-labelledby={id}>
	<div class="label">
		<h2 {id}>{title}</h2>
		{#if description}
			<p>
				{#if typeof description === 'string'}
					{description}
				{:else}
					{@render description()}
				{/if}
			</p>
		{/if}
	</div>

	<div class="content">
		{@render children()}
	</div>
</section>

<style>
	.section {
		display: grid;
		grid-template-columns: 1fr 1.618fr;
		align-items: start;
		gap: 2.5em;
	}

	.wide {
		grid-template-columns: 1fr;
		gap: 1.25em;
	}

	.divider {
		margin-top: 2.5em;
		padding-top: 2.5em;
		border-top: 1px solid var(--border, #ddd);
	}

	h2 {
		margin: 0 0 0.4em;
		font-size: 0.95em;
	}

	p {
		margin: 0;
		color: var(--muted, #666);
		font-size: 0.88em;
		line-height: 1.55;
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: 1.25em;
	}

	.danger h2 {
		color: var(--danger, #b42318);
	}

	@media (max-width: 900px) {
		.section {
			grid-template-columns: 1fr;
			gap: 1.25em;
		}
	}
</style>
