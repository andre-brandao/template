<!-- The signed-out home: what this is, and the way in. -->
<script lang="ts">
	import { Button } from '@template/ui';
	import { brand } from '#lib/brand.ts';
</script>

<section>
	<h1>{brand.name}</h1>
	<p>{brand.pitch}</p>
	<Button href="/login" variant="primary">Log in</Button>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 1em;
	}

	h1 {
		margin: 0;
		font-size: 1.5em;
		font-weight: 600;
	}

	p {
		margin: 0;
		color: var(--muted);
	}
</style>
