<!--
	A page's layout A/B test: tabs bound to `?variant=`, the chosen variant, and a vote for it.
	The last pick sticks per browser; the query param wins. Without a tally it is bare tabs.
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
	import { createQuery } from '@tanstack/svelte-query';
	import CircleHelp from '@lucide/svelte/icons/circle-help';
	import Star from '@lucide/svelte/icons/star';
	import { Button, Drawer, Field, Input, Issue, Popover, Tabs, toast } from '@template/ui';
	import { query } from '$lib/utils/params';
	import { tally, vote } from '../api/experiments.query';
	import { expose } from '../api/experiments.remote';

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

	// Storage is read once mounted, so the server render and hydration agree.
	let mounted = $state(false);
	onMount(() => (mounted = true));
	let remembered = $derived(mounted ? read(memory) : null);

	const current = $derived(
		[search[param], remembered].find((one) => !!one && one in variants) ?? names[0]
	);
	const Variant = $derived(variants[current].component);

	const votes = createQuery(() => tally({ key, title }));
	const mine = $derived(votes.data?.mine?.variant === current);

	let open = $state(false);
	let comment = $state('');
	const cast = vote({
		onSuccess: (_, input) => {
			open = false;
			toast.success(`Vote recorded for ${input.label}.`);
		}
	});

	// Counted once per variant shown. Untracked: the command bumps SvelteKit's pending count.
	$effect(() => {
		const input = { key, variant: current };
		untrack(() => expose(input).catch(() => {}));
	});

	// Blocked storage throws; the pick then lives in the URL only.
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
		} catch {}
		search.update({ [param]: name });
	}

	function start() {
		comment = mine ? (votes.data?.mine?.comment ?? '') : '';
		cast.reset();
		open = true;
	}
</script>

<div class="bar">
	<div class="title">{@render children?.()}</div>
	<div class="test">
		<Tabs.Root aria-label="Page variant">
			{#each names as name (name)}
				<Tabs.Item active={current === name} title={variants[name].hint} onclick={() => choose(name)}>
					{variants[name].label}
					{#if votes.data?.mine?.variant === name}
						<Star size={11} fill="currentColor" aria-label="your vote" />
					{/if}
					{#if votes.data?.votes[name]}
						<span class="votes">{votes.data.votes[name]}</span>
					{/if}
				</Tabs.Item>
			{/each}
		</Tabs.Root>
		{#if votes.data}
			<Button variant="ghost" onclick={start}>{mine ? 'Your vote' : 'Vote'}</Button>
		{/if}
		<Popover label="How this works" align="end">
			{#snippet trigger(attrs)}
				<button class="help" type="button" aria-label="How this works" {...attrs}>
					<CircleHelp size="1em" />
				</button>
			{/snippet}
			<div class="explain">
				<strong>This page is being tested</strong>
				<p>Switch layouts with the tabs; your pick is saved in this browser.</p>
				{#if votes.data}
					<p>Vote for the one you like, with an optional comment. Voting again moves it.</p>
				{/if}
				{#if votes.data?.url}
					<a href={votes.data.url} target="_blank" rel="noreferrer">See the discussion</a>
				{/if}
			</div>
		</Popover>
	</div>
</div>

<Variant {...props} />

<Drawer bind:open>
	<h2>Vote · {title}</h2>
	<p class="sub">
		You're voting for <strong>{variants[current].label}</strong>. Vote again from any variant and
		it moves there.
	</p>
	<div class="form">
		{#if cast.isError}<Issue>{cast.error.message}</Issue>{/if}
		<Field label="Comment (optional)">
			<Input
				placeholder="What works, what's missing, what confuses"
				value={comment}
				oninput={(e) => (comment = e.currentTarget.value)}
			/>
		</Field>
		<div class="foot">
			<Button
				variant="primary"
				pending={cast.isPending}
				onclick={() =>
					cast.mutate({
						key,
						title,
						variant: current,
						label: variants[current].label,
						comment: comment.trim() || undefined
					})}
			>
				Vote for {variants[current].label}
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
		gap: 0.4em;
		max-width: 100%;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.votes {
		color: var(--dim, #888);
		font-size: 0.9em;
		font-variant-numeric: tabular-nums;
	}

	.help {
		display: inline-grid;
		flex: none;
		place-items: center;
		width: 1.6em;
		height: 1.6em;
		padding: 0;
		border: 0;
		border-radius: var(--radius-sm, 4px);
		background: none;
		color: var(--muted, #666);
		cursor: pointer;
	}

	.help:hover {
		color: var(--ink, #111);
		background: var(--hover, #f2f2f2);
	}

	.explain {
		width: min(20rem, calc(100vw - 2rem));
		padding: 0.75em 0.9em;
		font-size: 0.82em;
		line-height: 1.45;
	}

	.explain p {
		margin: 0.5em 0 0;
		color: var(--muted, #666);
	}

	.explain a {
		display: inline-block;
		margin-top: 0.6em;
		color: var(--accent, #3b82f6);
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

	.form {
		display: flex;
		flex-direction: column;
		gap: 1em;
	}

	.foot {
		display: flex;
		justify-content: flex-end;
	}
</style>
