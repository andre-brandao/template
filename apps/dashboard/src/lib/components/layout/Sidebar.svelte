<script lang="ts">
	import { page } from '$app/state';

	const links = [
		{ href: '/projects', label: 'Projects' },
		{ href: '/todos', label: 'Todos' },
		{ href: '/files', label: 'Files' },
		{ href: '/insights', label: 'Insights' },
		{ href: '/settings', label: 'Settings' }
	];
</script>

<aside>
	<nav>
		{#each links as link (link.href)}
			<a
				class="navlink"
				href={link.href}
				aria-current={page.url.pathname.startsWith(link.href) ? 'page' : undefined}
			>
				{link.label}
			</a>
		{/each}
	</nav>
</aside>

<style>
	aside {
		width: 180px;
		flex-shrink: 0;
		padding: 1.25em 0.75em;
		border-right: 1px solid var(--border);
		background: var(--surface);
	}

	nav {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
	}

	a {
		font-family: var(--font-mono);
		font-size: 0.82em;
	}
</style>
