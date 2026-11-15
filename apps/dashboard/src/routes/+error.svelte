<script lang="ts">
	import { page } from '$app/state';
	import { dev } from '$app/env';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';
	import { Button } from '@template/ui';
	import { brand } from '#lib/brand.ts';
	import LogIn from '@lucide/svelte/icons/log-in';
	import SearchX from '@lucide/svelte/icons/search-x';
	import ShieldOff from '@lucide/svelte/icons/shield-off';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';

	// One entry per status the app produces; anything else reads as a server fault.
	const copy = {
		401: { title: 'Not signed in', hint: 'Sign in and try that again.', icon: LogIn },
		403: {
			title: 'Not allowed',
			hint: "Your account doesn't have access to this.",
			icon: ShieldOff
		},
		404: { title: 'Not found', hint: "That page doesn't exist, or it moved.", icon: SearchX }
	};

	const shown = $derived(
		copy[page.status as keyof typeof copy] ?? {
			title: 'Something broke',
			hint: "That one's on us. Try again in a moment.",
			icon: TriangleAlert
		}
	);

	// Only a server fault is the app's own failure; the rest are ordinary outcomes and stay
	// neutral rather than shouting in red.
	const bad = $derived(page.status >= 500);
	const Icon = $derived(shown.icon);

	// The hint whenever the message adds nothing: a 404 repeats the title, a prod 500 is generic.
	const detail = $derived(
		page.error?.message &&
			!(bad && !dev) &&
			page.error.message.toLowerCase() !== shown.title.toLowerCase()
			? page.error.message
			: shown.hint
	);

	// A direct load has nothing to go back to.
	let back = $state(false);
	onMount(() => (back = history.length > 1));
</script>

<svelte:head><title>{shown.title} · {brand.name}</title></svelte:head>

<main>
	<div class="card">
		<span class={['badge', { bad }]} aria-hidden="true">
			<Icon size={26} strokeWidth={1.5} />
		</span>
		<span class="status">{page.status}</span>
		<h1>{shown.title}</h1>
		<p class="detail">{detail}</p>

		{#if page.error?.code}
			<code class="code">{page.error.code}</code>
		{/if}

		<div class="acts">
			<Button href={resolve('/')}>Go home</Button>
			{#if page.status === 401}
				<Button
					variant="secondary"
					href="{resolve('login')}?next={encodeURIComponent(page.url.pathname + page.url.search)}"
					>Log in</Button
				>
			{:else if back}
				<Button variant="secondary" onclick={() => history.back()}>Go back</Button>
			{/if}
		</div>
	</div>
</main>

<style>
	main {
		flex: 1;
		display: grid;
		place-items: center;
		padding: 2em 1.25em;
		background: var(--bg);
	}

	.card {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		max-width: 34ch;
		padding: 2.5em 2em;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--surface);
		box-shadow: var(--shadow-2);
	}

	.badge {
		display: grid;
		place-items: center;
		width: 3.25em;
		height: 3.25em;
		margin-bottom: 0.9em;
		border-radius: 50%;
		background: var(--surface-2);
		color: var(--muted);
	}

	.badge.bad {
		background: color-mix(in oklab, var(--danger) 14%, var(--surface-2));
		color: var(--danger);
	}

	/* Small and recessive: the icon and heading carry it, the number is just context. */
	.status {
		font-family: var(--font-mono);
		font-size: 0.8em;
		letter-spacing: 0.1em;
		color: var(--dim);
		font-variant-numeric: tabular-nums;
	}

	h1 {
		margin: 0.25em 0 0;
		font-size: 1.25em;
	}

	.detail {
		margin: 0.6em 0 0;
		color: var(--muted);
		text-wrap: pretty;
	}

	.code {
		margin-top: 0.9em;
		padding: 0.2em 0.55em;
		border-radius: 999px;
		background: var(--surface-2);
		color: var(--dim);
		font-family: var(--font-mono);
		font-size: 0.75em;
	}

	.acts {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 0.5em;
		margin-top: 1.75em;
	}
</style>
