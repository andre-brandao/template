<script lang="ts">
	import { Inline } from '@template/ui';
	import { rename } from '../../api/apps.query';

	// The App's name, edited in place in its page header. `onchange` is the profile around it.
	let { id, name, onchange }: { id: string; name: string; onchange?: () => void } = $props();

	const save = rename({ onSuccess: () => onchange?.() });
</script>

<Inline
	label="App name"
	required
	flush
	value={name}
	onsave={(next) => save.mutateAsync({ id, name: next })}
/>
