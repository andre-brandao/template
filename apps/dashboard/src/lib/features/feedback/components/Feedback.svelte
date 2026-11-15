<!--
	The topbar feedback icon, beside the assistant toggle, and the drawer it opens. Feedback and
	support file on the same tracker; "Mine" lists what was sent.
-->
<script lang="ts">
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import { Drawer, IconButton, Tabs } from '@template/ui';
	import Form from './Form.svelte';
	import Mine from './Mine.svelte';

	const tabs = [
		{ value: 'feedback', label: 'Feedback' },
		{ value: 'support', label: 'Support' },
		{ value: 'mine', label: 'Mine' }
	] as const;

	let open = $state(false);
	let tab = $state<(typeof tabs)[number]['value']>('feedback');
</script>

<IconButton label="Feedback and support" onclick={() => (open = true)}>
	<MessageSquare size={17} strokeWidth={1.75} />
</IconButton>

<Drawer bind:open>
	<h2>Feedback and support</h2>
	<p class="sub">Report what's broken or missing, or ask for help. It goes straight to the team.</p>

	<Tabs.Root style="margin-bottom: 1.25em">
		{#each tabs as one (one.value)}
			<Tabs.Item active={tab === one.value} onclick={() => (tab = one.value)}>{one.label}</Tabs.Item>
		{/each}
	</Tabs.Root>

	<!-- Mounted while open only: the form reads the browser's context as it renders. -->
	{#if open}
		{#if tab === 'mine'}
			<Mine />
		{:else}
			{#key tab}
				<Form kind={tab} onsent={() => (tab = 'mine')} />
			{/key}
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
		color: var(--muted, #666);
	}
</style>
