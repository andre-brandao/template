<!-- The topbar's way into the assistant: opens and closes the dock beside the page. -->
<script lang="ts">
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import { agent } from '../agent.svelte';
	import Icon from './Icon.svelte';

	const ctx = agent();
</script>

<Icon
	aria-label={ctx.open ? 'Close assistant' : 'Open assistant'}
	title="Assistant"
	aria-pressed={ctx.open}
	onclick={ctx.toggle}
>
	<Sparkles size={17} strokeWidth={1.75} />
</Icon>
