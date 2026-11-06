<!--
	A page's layout A/B test: tabs bound to `?variant=`, the chosen variant, and a vote for it.
	The last pick sticks per browser; the query param wins. The tally degrades to bare tabs.
-->
<script module lang="ts">
	import type { Component } from 'svelte';

	/** The variants of one page, keyed by the slug the param carries. The first is the default. */
	export type Variants<P extends Record<string, unknown>> = Record<
		string,
		{ label: string; component: Component<P>; hint?: string }
	>;
</script>

<script lang="ts" generics="P extends Record<string, unknown>">
	import { onMount, untrack, type Snippet } from 'svelte';
	import { z } from 'zod';
	import type { Feedback } from '@template/core/feedback';
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import MessageSquareHeart from '@lucide/svelte/icons/message-square-heart';
	import Star from '@lucide/svelte/icons/star';
	import { Button, Drawer, Field, Tabs, toast } from '@template/ui';
	import { query } from '$lib/utils/params';
	import { expose, getTally, vote } from '../api/experiments.remote';

	let {
		key,
		title = key,
		variants,
		props,
		param = 'variant',
		children
	}: {
		/** Names the test: the vote thread and the remembered pick hang off it. */
		key: string;
		/** How the vote thread is titled. */
		title?: string;
		variants: Variants<P>;
		/** Handed to whichever variant is active. */
		props: P;
		/** The query param the tabs write. */
		param?: string;
		/** Sits left of the tabs: the page title, other controls. */
		children?: Snippet;
	} = $props();

	const names = $derived(Object.keys(variants));
	const memory = $derived(`experiment:${key}`);
	const search = $derived(query(z.object({ [param]: z.string().optional() })));

	// Storage is read only once mounted, so the server render and hydration agree.
	let mounted = $state(false);
	onMount(() => (mounted = true));
	let remembered = $derived(mounted ? read(memory) : null);

	const current = $derived(
		[search[param], remembered].find((one) => !!one && one in variants) ?? names[0]
	);
	const Variant = $derived(variants[current].component);

	// Counted once per variant shown. Untracked: the command bumps SvelteKit's pending
	// count, which the effect would otherwise read and rerun on forever.
	$effect(() => {
		const input = { key, variant: current };
		untrack(() => expose(input).catch(() => {}));
	});

	let open = $state(false);
	let comment = $state('');
	let sending = $state(false);

	const help = $props.id();

	function read(name: string) {
		try {
			return localStorage.getItem(name);
		} catch {
			return null;
		}
	}

	function choose(name: string) {
		remembered = name;
		try {
			localStorage.setItem(memory, name);
		} catch {
			// Storage blocked: the pick lives in the URL only.
		}
		search.update({ [param]: name });
	}

	// The top layer escapes the bar's overflow, so the spot is measured, clamped for phones.
	function place(event: ToggleEvent & { currentTarget: HTMLElement }) {
		const at = document.getElementById(`${help}-button`)?.getBoundingClientRect();
		if (event.newState !== 'open' || !at) return;
		const box = event.currentTarget;
		const width = box.getBoundingClientRect().width;
		box.style.left = `${Math.max(8, Math.min(at.right - width, innerWidth - width - 8))}px`;
		box.style.top = `${at.bottom + 6}px`;
	}

	function start(tally: Feedback.Experiment.Tally) {
		comment = tally.mine?.variant === current ? (tally.mine.comment ?? '') : '';
		open = true;
	}

	function send() {
		sending = true;
		const label = variants[current].label;
		vote({ key, title, variant: current, label, comment: comment.trim() || undefined })
			.updates(getTally({ key, title }))
			.then(() => {
				open = false;
				toast.success(`Vote recorded for ${label}.`);
			})
			.catch(() => toast.error('Could not record the vote.'))
			.finally(() => (sending = false));
	}
</script>

{#snippet tabs(tally: Feedback.Experiment.Tally | null)}
	<Tabs.Root aria-label="Page variant">
		{#each names as name (name)}
			<Tabs.Item
				active={current === name}
				title={variants[name].hint}
				onclick={() => choose(name)}
				style="display: inline-flex; align-items: center; gap: 0.35em; white-space: nowrap"
			>
				{variants[name].label}
				{#if tally?.mine?.variant === name}
					<Star size={11} fill="currentColor" aria-label="your vote" />
				{/if}
				{#if tally?.votes[name]}
					<span class="votes">{tally.votes[name]}</span>
				{/if}
			</Tabs.Item>
		{/each}
	</Tabs.Root>
{/snippet}

<!-- Without a tally (loading or failed) the voting paragraph drops out. -->
{#snippet explain(tally: Feedback.Experiment.Tally | null)}
	<button
		id="{help}-button"
		class="help"
		type="button"
		aria-label="How this works"
		title="How this works"
		popovertarget="{help}-text"
	>
		<CircleHelp size="1em" />
	</button>
	<div id="{help}-text" class="explain" popover="auto" ontoggle={place}>
		<strong>This page is being tested</strong>
		<p>
			We're trying out different layouts of this screen. Switch with the tabs; your pick is saved
			in this browser.
		</p>
		{#if tally}
			<p>
				Like one? Open it and click <strong>Give feedback</strong> to vote for it, with an optional
				comment. Sending again changes your vote.
			</p>
		{/if}
		<p>The votes help decide which variant stays.</p>
		{#if tally?.url}
			<a href={tally.url} target="_blank" rel="noreferrer">See the discussion</a>
		{/if}
	</div>
{/snippet}

<div class="bar">
	<div class="title">{@render children?.()}</div>
	<div class="test">
		<svelte:boundary>
			{@const tally = await getTally({ key, title })}
			{@const mine = tally.mine?.variant === current}
			{@render tabs(tally)}
			<button class={['cast', { mine }]} type="button" onclick={() => start(tally)}>
				<MessageSquareHeart size={13} />
				{mine ? 'Your feedback' : 'Give feedback'}
			</button>
			{@render explain(tally)}

			{#snippet pending()}
				{@render tabs(null)}
				{@render explain(null)}
			{/snippet}
			{#snippet failed()}
				{@render tabs(null)}
				{@render explain(null)}
			{/snippet}
		</svelte:boundary>
	</div>
</div>

<Variant {...props} />

<Drawer bind:open>
	<h2>Feedback · {title}</h2>
	<p class="sub">
		You're rating the <strong>{variants[current].label}</strong> variant. Sending counts as your vote
		for it; send again, from any variant, and the vote moves there.
	</p>
	<div class="form">
		<Field label="Comment (optional)">
			<textarea rows="5" placeholder="What works, what's missing, what confuses" bind:value={comment}
			></textarea>
		</Field>
		<div class="foot">
			<Button pending={sending} onclick={send}>
				<Star size={13} /> Vote for {variants[current].label}
			</Button>
		</div>
	</div>
</Drawer>

<style>
	.bar {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75em;
	}

	.title {
		min-width: 0;
	}

	.test {
		display: flex;
		align-items: center;
		gap: 0.5em;
		max-width: 100%;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.votes {
		color: var(--dim);
		font-size: 0.9em;
	}

	.cast {
		display: inline-flex;
		flex: none;
		align-items: center;
		gap: 0.35em;
		padding: 0.4em 0.85em;
		border: 1px solid var(--accent);
		border-radius: 999px;
		background: var(--accent);
		color: var(--accent-ink);
		font: 600 0.75em var(--font-sans);
		cursor: pointer;
		box-shadow: 0 0 0 0 color-mix(in oklab, var(--accent) 55%, transparent);
		animation: call 2.4s ease-out infinite;
	}

	.cast:hover {
		filter: brightness(1.12);
	}

	/* Already voted here: calm it down to an outlined pill, no pulse. */
	.cast.mine {
		background: color-mix(in oklab, var(--accent) 14%, transparent);
		color: var(--accent);
		animation: none;
	}

	@keyframes call {
		70% {
			box-shadow: 0 0 0 0.5em color-mix(in oklab, var(--accent) 0%, transparent);
		}
		100% {
			box-shadow: 0 0 0 0 color-mix(in oklab, var(--accent) 0%, transparent);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.cast {
			animation: none;
		}
	}

	.help {
		display: inline-grid;
		flex: none;
		place-items: center;
		width: 1.6em;
		height: 1.6em;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: none;
		color: var(--muted);
		cursor: pointer;
	}

	.help:hover {
		color: var(--ink);
	}

	.explain {
		position: fixed;
		inset: auto;
		width: min(20rem, calc(100vw - 2rem));
		margin: 0;
		padding: 0.85em 1em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		color: var(--ink);
		box-shadow: var(--shadow-1);
		font-size: 0.82em;
		line-height: 1.45;
	}

	.explain p {
		margin: 0.5em 0 0;
		color: var(--muted);
	}

	.explain a {
		display: inline-block;
		margin-top: 0.6em;
		color: var(--accent);
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

	.form {
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

	.foot {
		display: flex;
		justify-content: flex-end;
	}
</style>
