<script lang="ts">
	import { Inline } from '@template/ui';
	import { rename } from '../../api/apps.query';

	// The App's name, edited in place in its page header. `onchange` is the profile around it.
	let { id, name, onchange }: { id: string; name: string; onchange?: () => void } = $props();

	const save = rename({ onSuccess: () => onchange?.() });
</script>

<span class="name">
	<Inline
	label="App name"
	value={name}
	onsave={(next) => {
		if (!next) throw new Error('An app needs a name');
		return save.mutateAsync({ id, name: next });
	}}
	/>
</span>

<style>
	/* The face's padding lines its text up with the avatar gap. */
	.name {
		display: inline-block;
		min-width: 0;
		margin: -0.2em -0.4em;
	}
</style>
