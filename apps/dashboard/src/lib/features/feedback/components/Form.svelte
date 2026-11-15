<!--
	One `send` form per kind, so results and issues never leak between tabs. `support` is tagged
	by a hidden field. Mounted only while the drawer is open, so the browser context is client-only.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { innerHeight, innerWidth } from 'svelte/reactivity/window';
	import { Button, Field, FormBoundary, Issue } from '@template/ui';
	import { invalidate } from '$lib/query';
	import { send } from '../api/feedback.remote';
	import { tags, urgencies } from '../labels';
	import Choice from './Choice.svelte';
	import Files from './Files.svelte';

	let { kind, onsent }: { kind: 'feedback' | 'support'; onsent: () => void } = $props();

	const form = $derived(send.for(kind));
	const row = $derived(await form.result);
	const id = $props.id();
	let body = $state('');

	const types = (['bug', 'feature'] as const).map((value) => ({ value, label: tags[value].label }));
	const levels = (['low', 'medium', 'high'] as const).map((value) => ({
		value,
		label: urgencies[value].label
	}));
</script>

<FormBoundary>
	{#if row}
		<p class="done">
			Thanks, it's filed.
			{#if row.url}<a href={row.url} target="_blank" rel="noreferrer">View the issue</a>{/if}
		</p>
		<Button onclick={onsent}>See mine</Button>
	{:else}
		{#each form.fields.allIssues() ?? [] as issue, i (i)}
			<Issue>{issue.message}</Issue>
		{/each}

		<form
			enctype="multipart/form-data"
			{...form.enhance(async (submit) => {
				await submit.submit();
				if (!form.result) return;
				body = '';
				await invalidate(['feedback', 'mine']);
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

			<!-- Posted by the hidden mirror, so the textarea carries an id rather than a name. -->
			<Field label="Details">
				<textarea
					{id}
					rows="6"
					placeholder={kind === 'support'
						? 'What do you need help with? What you tried, where you got stuck'
						: 'What happened? Steps, context, anything useful'}
					bind:value={body}
				></textarea>
				<input {...form.fields.body.as('hidden', body)} />
			</Field>

			<Files />

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
		border: 1px solid var(--border, #ddd);
		border-radius: var(--radius, 6px);
		background: var(--surface, #fff);
		color: var(--ink, #111);
		resize: vertical;
	}

	.foot {
		display: flex;
		justify-content: flex-end;
	}

	.done {
		margin: 0 0 1em;
		font-size: 0.9em;
	}

	.done a {
		color: var(--accent, #3b82f6);
	}
</style>
