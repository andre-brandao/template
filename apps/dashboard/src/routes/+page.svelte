<script lang="ts">
	import { user } from '$lib/utils/context';
	import Topbar from '$lib/components/layout/Topbar.svelte';

	const me = user();
	const current = $derived(me.current);

	// The headline is the app's real state machine: each word is a lifecycle stage,
	// marked with the same status colors the board and the charts use.
	const stages = [
		{ word: 'Capture', color: 'var(--pending)' },
		{ word: 'Move', color: 'var(--progress)' },
		{ word: 'Ship', color: 'var(--done)' }
	];

	// The sidebar's own destinations, promoted to cards for people landing here.
	const places = [
		{ href: '/projects', label: 'Projects', hint: 'group work into spaces' },
		{ href: '/todos', label: 'Todos', hint: 'the board and the list' },
		{ href: '/files', label: 'Files', hint: 'everything attached, in one place' },
		{ href: '/insights', label: 'Insights', hint: 'trends once the dust settles' }
	];
</script>

<!-- The only page outside the app shell, so it carries its own header. -->
<Topbar user={current} />

<main>
	<h1>
		{#each stages as stage (stage.word)}
			<span class="stage" style:--c={stage.color}>
				<span class="dot" aria-hidden="true"></span>{stage.word}
			</span>
		{/each}
	</h1>

	{#if current}
		<p class="hello">Welcome back, {current.name}. Pick up where you left off.</p>
		<nav class="places" aria-label="Sections">
			{#each places as place (place.href)}
				<a href={place.href}>
					<span class="label">{place.label}</span>
					<span class="hint">{place.hint}</span>
				</a>
			{/each}
		</nav>
	{:else}
		<p class="pitch">
			A small dashboard for tracking work — capture todos into projects, move them across the
			board, and read the trends when the dust settles.
		</p>
		<a class="cta" href="/login">Log in</a>
	{/if}
</main>

<style>
	main {
		width: 100%;
		max-width: 34em;
		margin: 14vh auto 0;
		padding: 0 1.25em 4em;
		text-align: center;
	}

	h1 {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.4em 1.2em;
		margin: 0;
		font-family: var(--font-mono);
		font-size: clamp(1.4em, 5vw, 2em);
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.stage {
		display: inline-flex;
		align-items: center;
		gap: 0.45em;
	}

	/* Square like the brand mark, colored like the status it stands for. */
	.dot {
		width: 0.38em;
		height: 0.38em;
		border-radius: 2px;
		background: var(--c);
	}

	.hello,
	.pitch {
		margin: 1.4em 0 0;
		color: var(--muted);
		line-height: 1.6;
	}

	.cta {
		display: inline-block;
		margin-top: 1.8em;
		padding: 0.6em 1.4em;
		font-family: var(--font-mono);
		font-size: 0.85em;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		text-decoration: none;
		color: var(--accent-ink);
		background: var(--accent);
		border-radius: var(--radius);
	}

	.cta:hover {
		background: color-mix(in oklab, var(--accent) 88%, var(--ink));
	}

	.places {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75em;
		margin-top: 2.2em;
		text-align: left;
	}

	.places a {
		display: flex;
		flex-direction: column;
		gap: 0.3em;
		padding: 1em 1.1em;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius);
		text-decoration: none;
	}

	.places a:hover {
		border-color: var(--border-bright);
	}

	.label {
		font-weight: 600;
		font-size: 0.95em;
		color: var(--ink);
	}

	.hint {
		font-family: var(--font-mono);
		font-size: 0.72em;
		color: var(--muted);
	}

	@media (max-width: 520px) {
		main {
			margin-top: 8vh;
		}

		.places {
			grid-template-columns: 1fr;
		}
	}
</style>
