<script module lang="ts">
	import type { Story } from '../story';
	import Toaster from './Toaster.svelte';
	import Button from '../input/Button.svelte';
	import { toast } from './toast.svelte';

	export const story: Story = {
		title: 'Toaster',
		blurb:
			'A viewport singleton with no props — the app mounts one in its root layout and everything else calls `toast`. Three are visible at a time.',
		of: Toaster
	};
</script>

<script lang="ts">
	const wait = (ok: boolean) =>
		new Promise<string>((done, fail) =>
			setTimeout(() => (ok ? done('Uploaded') : fail(new Error('Nope'))), 1500)
		);
</script>

<div class="row">
	<Button variant="ghost" onclick={() => toast('Saved as draft')}>info</Button>
	<Button onclick={() => toast.success('Todo created')}>success</Button>
	<Button variant="danger" onclick={() => toast.error('Could not reach the server')}>error</Button>
	<Button variant="secondary" onclick={() => toast.loading('Working…')}>loading (sticky)</Button>
</div>

<div class="row">
	<Button
		variant="secondary"
		onclick={() => toast('Deleted', { action: { label: 'Undo', onclick: () => toast('Restored') } })}
	>
		with action
	</Button>
	<Button
		variant="secondary"
		onclick={() =>
			toast.promise(wait(true), { loading: 'Uploading…', success: 'Done', error: 'Failed' })}
	>
		promise (resolves)
	</Button>
	<Button
		variant="secondary"
		onclick={() =>
			toast
				.promise(wait(false), { loading: 'Uploading…', success: 'Done', error: 'Failed' })
				.catch(() => {})}
	>
		promise (rejects)
	</Button>
	<Button variant="ghost" onclick={() => toast.dismiss()}>dismiss all</Button>
</div>

<!-- The dashboard already mounts one in its root layout; this story reuses that. -->
<p class="note">
	Toasts land in the app's own Toaster, bottom of the viewport. Fire four to watch the third push
	the first out.
</p>

<style>
	.row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6em;
		margin-bottom: 0.8em;
	}

	.note {
		margin-top: 0.6em;
		color: var(--muted);
		font-size: 0.85em;
	}
</style>
