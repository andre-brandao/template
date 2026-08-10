<script lang="ts">
	import { Carta, MarkdownEditor as Editor } from 'carta-md';
	import { attachment } from '@cartamd/plugin-attachment';
	import DOMPurify from 'isomorphic-dompurify';
	import 'carta-md/default.css';
	import '@cartamd/plugin-attachment/default.css';
	import './markdown.css';

	let {
		value = $bindable(''),
		upload
	}: { value?: string; upload: (file: File) => Promise<string | null> } = $props();

	const carta = new Carta({
		sanitizer: DOMPurify.sanitize,
		extensions: [
			attachment({
				supportedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml'],
				upload: (file) => upload(file)
			})
		]
	});
</script>

<Editor {carta} bind:value />
