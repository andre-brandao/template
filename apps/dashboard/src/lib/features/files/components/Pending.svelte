<!-- A file on its way up: pulses while it sends, stays red with the reason if it fails. -->
<script lang="ts">
	import { IconButton, List } from '@template/ui';
	import Upload from '@lucide/svelte/icons/upload';
	import X from '@lucide/svelte/icons/x';
	import { size } from '#lib/utils/size.ts';

	let { file, error, ondismiss }: { file: File; error?: string; ondismiss: () => void } = $props();
</script>

<List.Row title={file.name} state={error ? 'failed' : 'pending'} message={error}>
	{#snippet lead()}<span class={['icon', { error }]}><Upload size={16} strokeWidth={1.75} /></span
		>{/snippet}
	{#snippet meta()}{size(file.size)}{/snippet}
	{#snippet actions()}
		{#if error}
			<IconButton label="Dismiss {file.name}" size="sm" onclick={ondismiss}>
				<X size={14} strokeWidth={1.75} />
			</IconButton>
		{/if}
	{/snippet}
</List.Row>

<style>
	.icon {
		display: grid;
		place-items: center;
		width: 1.6em;
		height: 1.6em;
		color: var(--dim);
	}

	.error {
		color: var(--danger);
	}
</style>
