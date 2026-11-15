<script lang="ts">
	import { Button, Kbd } from '@template/ui';
	import { createHotkey } from '@tanstack/svelte-hotkeys';

	// The page owns the upload IO (it also feeds drag-and-drop); this wraps the hidden picker.
	// Each file shows its own progress row, so the button never blocks another pick.
	let { upload }: { upload: (files: FileList) => void } = $props();

	let picker: HTMLInputElement | undefined = $state();

	/** Opens the file picker; the empty state reuses it. */
	export function open() {
		picker?.click();
	}

	createHotkey('C', open);
</script>

<input
	type="file"
	name="files"
	multiple
	hidden
	onchange={(e) => {
		if (e.currentTarget.files?.length) upload(e.currentTarget.files);
		e.currentTarget.value = '';
	}}
	{@attach (el) => {
		picker = el;
	}}
/>
<Button onclick={open}>Upload <Kbd keys="C" /></Button>
