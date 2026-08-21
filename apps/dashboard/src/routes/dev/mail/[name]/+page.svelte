<script lang="ts">
	import Preview from '../Preview.svelte';

	let { data } = $props();
</script>

<Preview mail={data.mail} />
