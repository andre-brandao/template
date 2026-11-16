<script lang="ts">
	import CalendarView from './calendar/CalendarView.svelte';

	let {
		scope = {},
		href = '/todos?view=calendar'
	}: {
		scope?: { source?: string; sourceID?: string };
		href?: string;
	} = $props();
</script>

<CalendarView filters={scope} compact {href} onchange={() => {}} />
