<!-- The topbar's way into the assistant: opens and closes the dock beside the page. -->
<script lang="ts">
	import { getFormatForDisplay } from '@tanstack/svelte-hotkeys';
	import { IconButton } from '@template/ui';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import { agent } from '../agent.svelte';

	const ctx = agent();
	// The dock binds Mod+J; the label shows it the platform's way (⌘J, Ctrl+J).
	const key = getFormatForDisplay()('Mod+J');
</script>

<IconButton
	label="{ctx.open ? 'Close' : 'Open'} assistant ({key})"
	aria-keyshortcuts="Control+J Meta+J"
	pressed={ctx.open}
	onclick={ctx.toggle}
>
	<Sparkles size={17} strokeWidth={1.75} />
</IconButton>
