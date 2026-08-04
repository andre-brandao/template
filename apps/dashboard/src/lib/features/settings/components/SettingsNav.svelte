<script lang="ts">
	import { page } from '$app/state';

	const sections = [
		{
			title: 'User',
			items: [
				{ href: '/settings/profile', label: 'Profile' },
				{ href: '/settings/experience', label: 'Experience' }
			]
		},
		{
			title: 'Workspace',
			items: [{ href: '/settings/keys', label: 'API keys' }]
		}
	];
</script>

<nav>
	{#each sections as section (section.title)}
		<div class="section">
			<span class="title">{section.title}</span>
			{#each section.items as item (item.href)}
				<a
					class="navlink"
					href={item.href}
					aria-current={page.url.pathname.startsWith(item.href) ? 'page' : undefined}
				>
					{item.label}
				</a>
			{/each}
		</div>
	{/each}
</nav>

<style>
	nav {
		display: flex;
		flex-direction: column;
		gap: 1.5em;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 0.25em;
	}

	.title {
		font-family: var(--font-mono);
		font-size: 0.68em;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--dim);
		padding: 0 0.7em;
		margin-bottom: 0.35em;
	}

	a {
		font-size: 0.88em;
		padding: 0.45em 0.7em;
	}
</style>
