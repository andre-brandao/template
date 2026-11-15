<!--
	The feedback affordance, in the rail footer or a rail-less topbar: a quiet trigger and the
	drawer it opens. Feedback and support file on the same tracker; "Mine" lists what was sent.
-->
<script lang="ts">
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import { Drawer, Tabs } from '@template/ui';
	import Form from './Form.svelte';
	import Mine from './Mine.svelte';

	// `slim`: the collapsed rail, icon only. `fill`: the rail footer, full width.
	let { slim = false, fill = false }: { slim?: boolean; fill?: boolean } = $props();

	const tabs = [
		{ value: 'feedback', label: 'Feedback' },
		{ value: 'support', label: 'Support' },
		{ value: 'mine', label: 'Mine' }
	] as const;

	let open = $state(false);
	let tab = $state<(typeof tabs)[number]['value']>('feedback');
</script>

<button
	class={['trigger', { slim, fill }]}
	type="button"
	aria-label={slim ? 'Feedback and support' : undefined}
	title={slim ? 'Feedback and support' : undefined}
	onclick={() => (open = true)}
>
	<MessageSquare size={15} strokeWidth={1.75} />
	{#if !slim}Feedback{/if}
</button>

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
	.trigger {
		display: inline-flex;
		align-items: center;
		align-self: center;
		gap: 0.4em;
		border: none;
		background: none;
		padding: 0.3em 0.5em;
		border-radius: var(--radius, 6px);
		font: inherit;
		font-size: 0.88em;
		white-space: nowrap;
		color: var(--muted, #666);
		cursor: pointer;
	}

	.trigger:hover {
		color: var(--ink, #111);
		background: var(--hover, #f2f2f2);
	}

	.trigger:focus-visible {
		outline: 2px solid var(--accent, #3b82f6);
		outline-offset: 1px;
	}

	.fill {
		width: 100%;
		padding: 0.45em 0.6em;
	}

	.slim {
		justify-content: center;
		padding: 0.45em;
	}

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
