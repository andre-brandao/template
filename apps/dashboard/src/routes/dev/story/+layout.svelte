<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { stories } from '@template/ui/story';

	let { children } = $props();
</script>

<div class="split">
	<nav aria-label="Components">
		{#each stories as entry (entry.slug)}
			<a
				class="navlink"
				href={resolve('/dev/story/[name]', { name: entry.slug })}
				aria-current={page.params.name === entry.slug ? 'page' : undefined}
			>
				{entry.story.title}
			</a>
		{/each}
	</nav>
	<div class="pane">{@render children()}</div>
</div>

<style>
	.split {
		display: flex;
		align-items: flex-start;
		gap: 2em;
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.15em;
		width: 12em;
		flex-shrink: 0;
		position: sticky;
		top: calc(var(--topbar) + 1.75em);
	}

	.navlink {
		font-size: 0.88em;
	}

	.pane {
		flex: 1;
		min-width: 0;
	}

	@media (max-width: 900px) {
		.split {
			flex-direction: column;
		}

		nav {
			position: static;
			width: 100%;
			flex-direction: row;
			flex-wrap: wrap;
		}
	}
</style>
