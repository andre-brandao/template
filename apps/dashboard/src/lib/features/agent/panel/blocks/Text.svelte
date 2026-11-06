<!-- A short markdown paragraph: context, or a reading of the numbers. -->
<script lang="ts">
	import { Markdown } from '@template/ui';
	import type { Block } from '../catalog';

	let { props }: Block<'Text'> = $props();
</script>

<div class="text"><Markdown value={props.content ?? ''} /></div>

<style>
	.text {
		min-width: 0;
		font-size: 0.88em;
	}
</style>
