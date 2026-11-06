<!-- A quiet spinner line while a tool's input streams in. -->
<script lang="ts">
	import { Spinner } from '@template/ui';

	let { label }: { label: string } = $props();
</script>

<span class="busy"><Spinner /> {label}</span>

<style>
	.busy {
		display: inline-flex;
		align-items: center;
		gap: 0.4em;
		color: var(--dim);
		font-size: 0.81em;
	}
</style>
