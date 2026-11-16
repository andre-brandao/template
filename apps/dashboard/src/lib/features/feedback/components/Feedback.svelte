<!--
	The topbar feedback icon, beside the assistant toggle, and the drawer it opens. Feedback and
	support file on the same tracker; "Mine" lists what was sent. A phone gets a bottom sheet.
-->
<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import Inbox from '@lucide/svelte/icons/inbox';
	import LifeBuoy from '@lucide/svelte/icons/life-buoy';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import { Drawer, IconButton, Tabs } from '@template/ui';
	import Form from './Form.svelte';
	import Mine from './Mine.svelte';

	const tabs = [
		{ value: 'feedback', label: 'Feedback', icon: MessageSquare },
		{ value: 'support', label: 'Support', icon: LifeBuoy },
		{ value: 'mine', label: 'Mine', icon: Inbox }
	] as const;

	const phone = new MediaQuery('max-width: 40em');
	let open = $state(false);
	let tab = $state<(typeof tabs)[number]['value']>('feedback');
</script>

<IconButton label="Feedback and support" onclick={() => (open = true)}>
	<MessageSquare size={17} strokeWidth={1.75} />
</IconButton>

<Drawer bind:open side={phone.current ? 'bottom' : 'right'}>
	<h2>Feedback and support</h2>
	<p class="sub">Report what's broken or missing, or ask for help. It goes straight to the team.</p>

	<Tabs.Root style="margin-bottom: 1.25em">
		{#each tabs as one (one.value)}
			<Tabs.Item active={tab === one.value} onclick={() => (tab = one.value)}>
				<one.icon size={14} strokeWidth={1.75} aria-hidden="true" />{one.label}
			</Tabs.Item>
		{/each}
	</Tabs.Root>

	<!-- Mounted while open only: the form reads the browser's context as it renders. Both forms
	     stay mounted behind the tabs, so switching keeps each draft and its files. -->
	{#if open}
		<div hidden={tab !== 'feedback'}>
			<Form kind="feedback" onsent={() => (tab = 'mine')} />
		</div>
		<div hidden={tab !== 'support'}>
			<Form kind="support" onsent={() => (tab = 'mine')} />
		</div>
		{#if tab === 'mine'}
			<Mine onnew={() => (tab = 'feedback')} />
		{/if}
	{/if}
</Drawer>

<style>
	h2 {
		margin: 0 0 0.25em;
		font-size: 1.05em;
	}

	.sub {
		margin: 0 0 1.25em;
		font-size: 0.85em;
		color: var(--muted);
	}
</style>
