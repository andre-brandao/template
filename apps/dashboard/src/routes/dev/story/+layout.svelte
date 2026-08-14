<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { stories } from '@template/ui/story';

	let { children } = $props();
</script>

<div class="split">
	<nav aria-label="Components">
		{#each stories as entry (entry.slug)}
			<!-- The search carries the open tab, so switching component keeps the view. -->
			<a
				class="navlink"
				href={resolve('/dev/story/[name]', { name: entry.slug }) + page.url.search}
				aria-current={page.params.name === entry.slug ? 'page' : undefined}
			>
				{entry.story.title}
			</a>
		{/each}
	</nav>
	<div class="pane">{@render children()}</div>
</div>

<style>
	/* The screen fills what the shell leaves it and the stage scrolls inside, so the
	   component list and the story header hold still between stories. */
	.split {
		display: flex;
		align-items: stretch;
		gap: 2em;
		height: var(--fill);
		min-height: 26em;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		width: 12em;
		flex-shrink: 0;
		overflow-y: auto;
		scrollbar-gutter: stable;
	}

	.navlink {
		font-size: 0.88em;
	}

	.pane {
		flex: 1;
		min-width: 0;
		min-height: 0;
	}

	@media (max-width: 900px) {
		.split {
			flex-direction: column;
			height: auto;
		}

		nav {
			width: 100%;
			flex-direction: row;
			flex-wrap: wrap;
			overflow: visible;
		}
	}
</style>
