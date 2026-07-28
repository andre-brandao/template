<script lang="ts">
	import { Button } from '@template/ui';

	let { pending, onfiles }: { pending: boolean; onfiles: (files: FileList) => void } = $props();

	let picker: HTMLInputElement | undefined = $state();
</script>

<input
	type="file"
	multiple
	hidden
	bind:this={picker}
	onchange={(e) => {
		const list = e.currentTarget.files;
		if (list?.length) onfiles(list);
		e.currentTarget.value = '';
	}}
/>
<Button {pending} onclick={() => picker?.click()}>Upload</Button>
