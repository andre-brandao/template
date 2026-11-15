<!-- The drawer's bar: history, tools, new conversation, full screen, close. Its mark is the one activity cue. -->
<script lang="ts">
	import { IconButton } from '@template/ui';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import X from '@lucide/svelte/icons/x';
	import Maximize from '@lucide/svelte/icons/maximize-2';
	import Minimize from '@lucide/svelte/icons/minimize-2';
	import History from '@lucide/svelte/icons/history';
	import Wrench from '@lucide/svelte/icons/wrench';
	import { agent } from '../agent.svelte';
	import Avatar from './Avatar.svelte';

	const ctx = agent();
	const Size = $derived(ctx.full ? Minimize : Maximize);
</script>

<header>
	<span class="title"><Avatar size={24} state={ctx.activity.state} />Assistant</span>
	<span class="actions">
		<IconButton
			label="History"
			pressed={ctx.tab === 'history'}
			onclick={() => (ctx.tab = ctx.tab === 'history' ? 'chat' : 'history')}
		>
			<History size={17} strokeWidth={1.75} />
		</IconButton>
		<IconButton
			label="Tools"
			pressed={ctx.tab === 'tools'}
			onclick={() => (ctx.tab = ctx.tab === 'tools' ? 'chat' : 'tools')}
		>
			<Wrench size={17} strokeWidth={1.75} />
		</IconButton>
		<IconButton label="New conversation" onclick={ctx.fresh}>
			<SquarePen size={17} strokeWidth={1.75} />
		</IconButton>
		<!-- A phone is always full screen, so there is nothing to toggle. -->
		{#if !ctx.narrow}
			<IconButton
				label={ctx.full ? 'Exit full screen' : 'Full screen'}
				pressed={ctx.full}
				onclick={ctx.widen}
			>
				<Size size={17} strokeWidth={1.75} />
			</IconButton>
		{/if}
		<IconButton label="Close assistant" onclick={ctx.close}>
			<X size={17} strokeWidth={1.75} />
		</IconButton>
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
		--control: 2em;
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
