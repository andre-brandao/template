<!--
	One `send` form, its own instance per kind so results and issues never leak between tabs.
	`feedback` picks bug or feature; `support` is tagged by a hidden field. Mounted only while
	the drawer is open, so the browser context below is read on the client alone.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { innerHeight, innerWidth } from 'svelte/reactivity/window';
	import Bug from '@lucide/svelte/icons/bug';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import { Button, Field, FormBoundary, Issue } from '@template/ui';
	import { send } from '../api/feedback.remote';
	import Choice from './Choice.svelte';
	import Files from './Files.svelte';

	let {
		kind,
		onsent,
		onclose
	}: { kind: 'feedback' | 'support'; onsent: () => Promise<void>; onclose: () => void } = $props();

	const form = $derived(send.for(kind));
	// The result types as maybe-a-promise, like every remote form here.
	const row = $derived(await form.result);
	const id = $props.id();
	let body = $state('');

	const urgencies = [
		{ value: 'low' as const, label: 'Low', tone: 'done', level: 1 },
		{ value: 'medium' as const, label: 'Medium', tone: 'progress', level: 2 },
		{ value: 'high' as const, label: 'High', tone: 'danger', level: 3 }
	];
</script>

{#snippet done(url?: string)}
	<p class="done">
		{#if url}
			Thanks! <a href={url} target="_blank" rel="noreferrer">View the issue</a>.
		{:else}
			Thanks! {kind === 'support' ? 'Support request' : 'Feedback'} received.
		{/if}
	</p>
	<Button onclick={onclose}>Done</Button>
{/snippet}

{#snippet type()}
	{#if kind === 'support'}
		<input {...form.fields.tag.as('hidden', 'support')} />
	{:else}
		<Field label="Type" as="div" role="radiogroup" aria-label="Type">
			<Choice
				field={form.fields.tag}
				fallback="bug"
				variant="segment"
				options={[
					{ value: 'bug', label: 'Bug', hint: 'Something broken or wrong', icon: Bug, tone: 'danger' },
					{ value: 'feature', label: 'Feature', hint: 'An idea or something missing', icon: Sparkles, tone: 'accent' }
				]}
			/>
		</Field>
	{/if}
{/snippet}

<FormBoundary>
	{#if row}
		{@render done(row.url)}
	{:else}
		{#if kind === 'support'}
			<p class="intro">Need help using the app? The team answers here.</p>
		{/if}

		{#each form.fields.allIssues() ?? [] as issue, i (i)}
			<Issue>{issue.message}</Issue>
		{/each}

		<form
			enctype="multipart/form-data"
			{...form.enhance(async (submit) => {
				await submit.submit();
				if (!form.result) return;
				body = '';
				await onsent();
			})}
		>
			{@render type()}

			<Field label="Urgency" as="div" role="radiogroup" aria-label="Urgency">
				<Choice field={form.fields.urgency} fallback="low" variant="segment" options={urgencies} />
			</Field>

			<!-- Posted by the hidden mirror, so the textarea carries an id rather than a name. -->
			<Field label="Details">
				<textarea
					{id}
					rows="6"
					placeholder={kind === 'support'
						? "What do you need help with? Tell us what you tried and where you got stuck"
						: 'What happened? Steps, context, anything useful'}
					bind:value={body}
				></textarea>
				<input {...form.fields.body.as('hidden', body)} />
			</Field>

			<Files />

			<input {...form.fields.page.as('hidden', page.url.pathname + page.url.search)} />
			<input {...form.fields.agent.as('hidden', navigator.userAgent.slice(0, 500))} />
			<input {...form.fields.viewport.as('hidden', `${innerWidth.current}x${innerHeight.current}`)} />
			<input {...form.fields.locale.as('hidden', navigator.language)} />
			<input
				{...form.fields.timezone.as('hidden', Intl.DateTimeFormat().resolvedOptions().timeZone)}
			/>

			<div class="foot">
				<Button type="submit" pending={!!form.pending}>Send</Button>
			</div>
		</form>
	{/if}
</FormBoundary>

<style>
	form {
		display: flex;
		flex-direction: column;
		gap: 1em;
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

	.intro {
		margin: 0 0 1.25em;
		font-size: 0.85em;
		color: var(--muted);
	}

	.foot {
		display: flex;
		justify-content: flex-end;
	}

	.done a {
		color: var(--accent);
	}
</style>
