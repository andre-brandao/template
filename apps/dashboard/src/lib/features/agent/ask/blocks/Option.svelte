<!-- One option of a Choice or MultiChoice: the control, its label, and why it is suggested. -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label,
		description,
		suggested,
		children
	}: { label: string; description?: string | null; suggested?: boolean; children: Snippet } =
		$props();
</script>

<label>
	{@render children()}
	<span>
		{label}{#if suggested}<em> · suggested</em>{/if}
		{#if description}<small>{description}</small>{/if}
	</span>
</label>

<style>
	label {
		display: flex;
		align-items: flex-start;
		gap: 0.5em;
		font-size: 0.88em;
		cursor: pointer;
	}

	span {
		display: flex;
		flex-direction: column;
	}

	em {
		color: var(--accent);
		font-style: normal;
		font-size: 0.85em;
	}

	small {
		color: var(--muted);
	}
</style>
