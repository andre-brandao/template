<!-- The drawer's bar: history, new conversation, full screen, close. -->
<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import X from '@lucide/svelte/icons/x';
	import Maximize from '@lucide/svelte/icons/maximize-2';
	import Minimize from '@lucide/svelte/icons/minimize-2';
	import History from '@lucide/svelte/icons/history';
	import { agent } from '../agent.svelte';
	import Avatar from './Avatar.svelte';
	import Icon from './Icon.svelte';

	const ctx = agent();
	// The Shell's breakpoint: a phone is always full screen, so there is nothing to toggle.
	const narrow = new MediaQuery('max-width: 700px');
	const wide = $derived(ctx.full ? 'Exit full screen' : 'Full screen');
	const Size = $derived(ctx.full ? Minimize : Maximize);
</script>

<header>
	<span class="title"><Avatar size={24} state={ctx.activity.state} />Assistant</span>
	<span class="actions">
		<Icon
			aria-label="History"
			title="History"
			aria-pressed={ctx.tab === 'history'}
			onclick={() => (ctx.tab = ctx.tab === 'history' ? 'chat' : 'history')}
		>
			<History size={17} strokeWidth={1.75} />
		</Icon>
		<Icon aria-label="New conversation" title="New conversation" onclick={ctx.fresh}>
			<SquarePen size={17} strokeWidth={1.75} />
		</Icon>
		{#if !narrow.current}
			<Icon aria-label={wide} title={wide} aria-pressed={ctx.full} onclick={ctx.widen}>
				<Size size={17} strokeWidth={1.75} />
			</Icon>
		{/if}
		<Icon aria-label="Close assistant" title="Close" onclick={ctx.close}>
			<X size={17} strokeWidth={1.75} />
		</Icon>
	</span>
</header>

<style>
	header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
		height: var(--topbar);
		padding: 0 0.75em 0 1em;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}

	.title {
		display: inline-flex;
		align-items: center;
		gap: 0.55em;
		font-weight: 600;
		color: var(--ink);
	}

	.actions {
		display: inline-flex;
		gap: 0.25em;
	}
</style>
