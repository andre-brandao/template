<script lang="ts">
	import type { Snippet } from 'svelte';
	import { page } from '$app/state';

	let { href, title, children }: { href: string; title?: string; children: Snippet } = $props();

	// Companion docs open as a tab; sibling mockups open standalone from the raw route.
	const to = $derived.by(() => {
		if (/^(https?:|mailto:|\/|#)/i.test(href)) return href;
		const name = href.replace(/^\.\//, '');
		if (name.endsWith('.md')) return `?doc=${name.slice(0, -3)}`;
		return `/dev/prototype/${page.params.feature}/${name}`;
	});
	const ext = $derived(
		/^https?:/i.test(to) || to.startsWith('/dev/prototype/')
			? { rel: 'noopener noreferrer', target: '_blank' }
			: {}
	);
</script>

<a href={to} {title} {...ext}>{@render children()}</a>
