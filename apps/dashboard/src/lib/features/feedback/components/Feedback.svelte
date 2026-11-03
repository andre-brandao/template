<!--
	The feedback affordance, in the rail footer or a rail-less topbar: a quiet trigger and the
	drawer it opens. Feedback and support are separate forms on the same tracker; "Mine" lists
	what was filed.
-->
<script lang="ts">
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import { Drawer, Tabs } from '@template/ui';
	import { getMine } from '../api/feedback.remote';
	import Form from './Form.svelte';
	import Mine from './Mine.svelte';

	// `slim`: the collapsed rail, icon only. `fill`: the rail footer, full width and left-aligned.
	let { slim = false, fill = false }: { slim?: boolean; fill?: boolean } = $props();

	let open = $state(false);
	let tab = $state<'feedback' | 'support' | 'mine'>('feedback');

	async function sent() {
		tab = 'mine';
		await getMine().refresh();
	}
</script>

<button
	class={['trigger', { slim, fill }]}
	type="button"
	aria-label={slim ? 'Feedback and support' : undefined}
	title={slim ? 'Feedback and support' : undefined}
	onclick={() => (open = true)}
>
	<MessageSquare size={15} strokeWidth={1.75} />
	{#if !slim}Feedback and support{/if}
</button>

<Drawer bind:open>
	<h2>Feedback and support</h2>
	<p class="sub">
		Tell us what's broken, what's missing, or ask for help. It goes straight to the team.
	</p>

	<Tabs.Root style="margin-bottom: 1.25em">
		<Tabs.Item active={tab === 'feedback'} onclick={() => (tab = 'feedback')}>Feedback</Tabs.Item>
		<Tabs.Item active={tab === 'support'} onclick={() => (tab = 'support')}>Support</Tabs.Item>
		<Tabs.Item active={tab === 'mine'} onclick={() => (tab = 'mine')}>Mine</Tabs.Item>
	</Tabs.Root>

	<!-- Mounted while open only: the forms read the browser's context as they render. -->
	{#if open}
		{#if tab === 'mine'}
			<Mine />
		{:else}
			{#key tab}
				<Form kind={tab} onsent={sent} onclose={() => (open = false)} />
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
		border-radius: var(--radius);
		font-size: 0.92em;
		white-space: nowrap;
		color: var(--muted);
		cursor: pointer;
	}

	.trigger:hover {
		color: var(--ink);
		background: var(--surface-2);
	}

	.trigger:focus-visible {
		outline: 2px solid var(--accent);
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
		color: var(--muted);
	}
</style>
