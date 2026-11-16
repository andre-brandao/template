<!--
	One `send` form per kind, so results and issues never leak between tabs. `support` is tagged
	by a hidden field. Mounted only while the drawer is open, so the browser context is client-only.
	"Send another" bumps the round, which is a fresh form instance with nothing left over.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { innerHeight, innerWidth } from 'svelte/reactivity/window';
	import { createHotkeyAttachment } from '@tanstack/svelte-hotkeys';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Send from '@lucide/svelte/icons/send';
	import { Button, Field, FormBoundary, Issue, Kbd } from '@template/ui';
	import { invalidate } from '#lib/query.ts';
	import { send } from '../api/feedback.remote';
	import { tags, urgencies } from '../labels';
	import Choice from './Choice.svelte';
	import Files from './Files.svelte';

	let { kind, onsent }: { kind: 'feedback' | 'support'; onsent: () => void } = $props();

	let round = $state(0);
	const form = $derived(send.for(`${kind}-${round}`));
	const row = $derived(form.result);
	const id = $props.id();

	// Body and files sit by their fields; anything else (a tracker outage) heads the form.
	const issues = $derived(form.fields.allIssues() ?? []);
	const at = (key: string) => issues.filter((one) => one.path[0] === key);
	const rest = $derived(issues.filter((one) => !['body', 'files'].includes(String(one.path[0]))));

	const types = (['bug', 'feature'] as const).map((value) => ({ value, ...tags[value] }));
	const levels = (['low', 'medium', 'high'] as const).map((value) => ({
		value,
		...urgencies[value]
	}));

	// The words that differ between the two kinds; the form around them is the same.
	const copy = $derived(
		kind === 'support'
			? {
					title: () => 'Your request is with the team',
					next: 'Someone will reply on the ticket.',
					placeholder: 'What do you need help with? What you tried, where you got stuck'
				}
			: {
					title: (tag: string) => `Thanks, your ${tag.toLowerCase()} is filed`,
					next: 'The team reads every one and replies on the ticket.',
					placeholder: 'What happened? Steps, context, anything useful'
				}
	);

	// Mod+Enter sends from any field, the textarea included.
	const hotkey = createHotkeyAttachment(
		'Mod+Enter',
		() => !form.pending && form.element?.requestSubmit()
	);
</script>

{#snippet sent(row: NonNullable<typeof form.result>)}
	<div class="sent" role="status">
		<span class="check"><CircleCheck size={22} strokeWidth={2} /></span>
		<h3 tabindex="-1" {@attach (node) => node.focus()}>{copy.title(tags[row.tag].label)}</h3>
		<p>{copy.next} Follow it, and any replies, under Mine.</p>
		<div class="actions">
			<Button variant="primary" onclick={onsent}>See it in Mine</Button>
			<Button variant="ghost" onclick={() => round++}>Send another</Button>
			{#if row.url}
				<a href={row.url} target="_blank" rel="noreferrer">Open on the tracker</a>
			{/if}
		</div>
	</div>
{/snippet}

<FormBoundary>
	{#if row}
		{@render sent(row)}
	{:else}
		{#each rest as issue, i (i)}
			<Issue>{issue.message}</Issue>
		{/each}

		<form
			enctype="multipart/form-data"
			{@attach hotkey}
			{...form.enhance(async (submit) => {
				if (await submit.submit()) await invalidate(['feedback', 'mine']);
			})}
		>
			{#if kind === 'support'}
				<input {...form.fields.tag.as('hidden', 'support')} />
			{:else}
				<Field label="Type" as="div">
					<Choice field={form.fields.tag} fallback="bug" label="Type" options={types} />
				</Field>
			{/if}

			<Field label="Urgency" as="div">
				<Choice field={form.fields.urgency} fallback="low" label="Urgency" options={levels} />
			</Field>

			<!-- The help sits outside the label so it isn't read as the textarea's name. -->
			<div class="details">
				<Field label="Details">
					<textarea
						{...form.fields.body.as('text')}
						rows="6"
						aria-describedby="{id}-body"
						placeholder={copy.placeholder}></textarea>
				</Field>
				<p class="help" id="{id}-body">
					{#each at('body') as issue, i (i)}
						<span class="error">{issue.message}</span>
					{:else}
						The first line becomes the title. Paste or drop screenshots right here.
					{/each}
				</p>
			</div>

			<Files field={form.fields.files} issues={at('files')} />

			<input {...form.fields.page.as('hidden', page.url.pathname + page.url.search)} />
			<input {...form.fields.agent.as('hidden', navigator.userAgent.slice(0, 500))} />
			<input
				{...form.fields.viewport.as('hidden', `${innerWidth.current}x${innerHeight.current}`)}
			/>
			<input {...form.fields.locale.as('hidden', navigator.language)} />
			<input
				{...form.fields.timezone.as('hidden', Intl.DateTimeFormat().resolvedOptions().timeZone)}
			/>

			<div class="foot">
				<p>Sent with this page's address and your browser details.</p>
				<Button variant="primary" type="submit" pending={!!form.pending}>
					{#if !form.pending}<Send size={14} strokeWidth={2} />{/if}
					{form.pending ? 'Sending' : 'Send'}
					<Kbd keys="Mod+Enter" />
				</Button>
			</div>
		</form>
	{/if}
</FormBoundary>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1.1em;
	}

	textarea {
		font: inherit;
		padding: 0.5em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		resize: vertical;
	}

	textarea:focus-visible {
		outline: none;
		border-color: var(--accent);
		box-shadow: var(--ring);
	}

	textarea[aria-invalid='true'] {
		border-color: var(--danger);
	}

	.details {
		display: flex;
		flex-direction: column;
		gap: 0.35em;
	}

	.help {
		margin: 0;
		font-size: 0.8em;
		color: var(--dim);
	}

	.error {
		color: var(--danger);
	}

	.foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1em;
		padding-top: 0.25em;
	}

	.foot p {
		margin: 0;
		font-size: 0.78em;
		color: var(--dim);
	}

	.sent {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.6em;
		padding: 1.1em 1.15em;
		border: 1px solid color-mix(in oklab, var(--done) 45%, var(--border));
		border-radius: var(--radius);
		background: color-mix(in oklab, var(--done) 8%, var(--surface));
	}

	.check {
		display: grid;
		place-items: center;
		width: 2.4em;
		height: 2.4em;
		border-radius: 50%;
		background: color-mix(in oklab, var(--done) 16%, var(--surface));
		color: var(--done);
	}

	h3 {
		margin: 0;
		font-size: 1em;
		outline: none;
	}

	.sent p {
		margin: 0;
		font-size: 0.88em;
		color: var(--muted);
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5em;
		margin-top: 0.3em;
	}

	.actions a {
		font-size: 0.88em;
		color: var(--accent);
	}
</style>
