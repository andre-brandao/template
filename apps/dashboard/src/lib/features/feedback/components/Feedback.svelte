<!--
	The topbar's feedback affordance: a quiet trigger and the drawer it opens. Files an
	issue in the tracker configured by env; the page the user was on rides along hidden.
-->
<script lang="ts">
	import { page } from '$app/state';
	import MessageSquare from '@lucide/svelte/icons/message-square';
	import { Button, Drawer, Field, FormBoundary, Issue } from '@template/ui';
	import { send } from '../api/feedback.remote';

	let open = $state(false);
	let body = $state('');
	// The value is submitted by the hidden mirror below, so the textarea carries an id
	// rather than a name — a second `body` field would post the value twice.
	const id = $props.id();
	const result = $derived(send.result as any);
</script>

<button class="trigger" type="button" onclick={() => (open = true)}>
	<MessageSquare size={15} strokeWidth={1.75} />
	Feedback
</button>

<Drawer bind:open onclose={() => (body = '')}>
	<h2>Feedback</h2>
	<p class="sub">Tell us what's broken or missing — it goes straight to the issue tracker.</p>

	<FormBoundary>
		{#if result}
			<p class="done">
				Thanks — <a href={result.url} target="_blank" rel="noreferrer">view the issue</a>.
			</p>
			<Button onclick={() => (open = false)}>Done</Button>
		{:else}
			{#each send.fields.allIssues() ?? [] as issue, i (i)}
				<Issue>{issue.message}</Issue>
			{/each}

			<form
				{...send.enhance(async (f) => {
					await f.submit();
				})}
			>
				<div class="pair">
					<Field label="Type">
						<select {...send.fields.tag.as('select')}>
							<option value="bug">Bug</option>
							<option value="feature">Feature</option>
						</select>
					</Field>

					<Field label="Urgency">
						<select {...send.fields.urgency.as('select')}>
							<option value="low">Low</option>
							<option value="medium">Medium</option>
							<option value="high">High</option>
						</select>
					</Field>
				</div>

				<Field label="Details">
					<textarea
						{id}
						rows="6"
						placeholder="What happened? Steps, context, anything useful"
						bind:value={body}
					></textarea>
					<input {...send.fields.body.as('hidden', body)} />
				</Field>

				<input {...send.fields.page.as('hidden', page.url.pathname + page.url.search)} />

				<div class="foot">
					<Button type="submit" pending={!!send.pending}>Send</Button>
				</div>
			</form>
		{/if}
	</FormBoundary>
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
		font-family: var(--font-mono);
		font-size: 0.82em;
		color: var(--muted);
		cursor: pointer;
	}

	.trigger:hover {
		color: var(--ink);
		background: var(--surface-2);
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

	form {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.pair {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(9em, 1fr));
		gap: 1em;
	}

	select,
	textarea {
		font: inherit;
		padding: 0.5em 0.7em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
	}

	textarea {
		resize: vertical;
	}

	.foot {
		display: flex;
		justify-content: flex-end;
	}

	.done a {
		color: var(--accent);
	}
</style>
