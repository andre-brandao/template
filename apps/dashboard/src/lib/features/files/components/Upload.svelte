<script lang="ts">
	import { Button } from '@template/ui';

	// The page owns the upload IO (it also feeds drag-and-drop); this just wraps
	// the hidden picker behind a button.
	let { upload, pending = false }: { upload: (files: FileList) => void; pending?: boolean } =
		$props();

	let picker: HTMLInputElement | undefined = $state();

	function pick(e: Event & { currentTarget: HTMLInputElement }) {
		if (e.currentTarget.files?.length) upload(e.currentTarget.files);
		e.currentTarget.value = '';
	}
</script>

<input type="file" name="files" multiple hidden onchange={pick} {@attach (el) => { picker = el; }} />
<Button {pending} onclick={() => picker?.click()}>Upload</Button>
