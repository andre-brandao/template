<!-- How the board and timeline split their rows; a `Header.Group` for the filter strip. -->
<script lang="ts">
	import { Select } from '@template/ui';
	import * as Header from '$lib/components/header';
	import type { By } from '../group';

	let { by = 'status', onchange }: { by?: By; onchange: (by: By) => void } = $props();
</script>

<Header.Group label="Group">
	<Select
		name="group"
		aria-label="Group by"
		value={by}
		options={[
			{ value: 'status', label: 'Status' },
			{ value: 'stage', label: 'Stage' },
			{ value: 'assignee', label: 'Assignee' }
		]}
		onchange={(e) => onchange(e.currentTarget.value as By)}
	/>
</Header.Group>
