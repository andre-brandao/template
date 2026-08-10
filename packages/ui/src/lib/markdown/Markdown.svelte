<script lang="ts">
	import { Carta, Markdown as Viewer } from 'carta-md';
	import DOMPurify from 'isomorphic-dompurify';
	import 'carta-md/default.css';
	import './markdown.css';

	let { value }: { value: string } = $props();

	const carta = new Carta({ sanitizer: DOMPurify.sanitize });
</script>

<Viewer {carta} {value} />
