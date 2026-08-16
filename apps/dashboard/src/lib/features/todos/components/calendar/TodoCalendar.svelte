<script lang="ts">
	import { browser } from '$app/environment';
	import {
		Calendar,
		DayGrid,
		Interaction,
		List,
		ResourceTimeGrid,
		ResourceTimeline,
		TimeGrid
	} from '@event-calendar/core';
	import type { Todo } from '@template/core/todo';
	import { user } from '$lib/utils/context';
	import type { By } from '../../group';
	import { events, grouped, resources, span, stamp, type Move, type View } from '../../calendar';

	let {
		todos,
		view,
		by,
		onopen,
		onpick,
		onmove
	}: {
		todos: Todo.Info[];
		view: View;
		/** The resource axis. Only the resource views draw it. */
		by: By;
		onopen: (id: string) => void;
		onpick: (day: string) => void;
		/** Resolves false when the write failed, and the drag is put back. */
		onmove: (next: Move) => Promise<boolean>;
	} = $props();

	const me = user();

	/** A drop onto another row rewrites whichever field that axis stands for. */
	function lane(id: string): Partial<Move> {
		if (by === 'status') return { status: id as Todo.Status };
		if (by === 'stage') return { stage: id === 'none' ? null : id };
		return { assignee: id === 'none' ? null : id };
	}

	async function keep(info: Calendar.EventDropInfo | Calendar.EventResizeInfo) {
		const to = 'newResource' in info ? info.newResource : undefined;
		const ok = await onmove({
			id: String(info.event.id),
			...span(info.event),
			...(to ? lane(String(to.id)) : {})
		});
		if (!ok) info.revert();
	}

	// Declared once so their identities hold: the library applies whichever option keys
	// changed since the last render, and a fresh callback would count as a change.
	const fixed = {
		height: '100%',
		editable: true,
		nowIndicator: true,
		dayMaxEvents: true,
		buttonText: { today: 'Today' },
		headerToolbar: { start: 'prev,next today', center: 'title', end: '' },
		eventClick: (info: Calendar.EventClickInfo) => onopen(String(info.event.id)),
		dateClick: (info: Calendar.DateClickInfo) => onpick(stamp(info.date)),
		eventDrop: keep,
		eventResize: keep
	};

	const options = $derived<Calendar.Options>({
		...fixed,
		view,
		events: events(todos, by),
		// Empty off the resource views, so a hidden axis can't reorder anything.
		resources: grouped(view) ? resources(todos, by) : [],
		locale: me.prefs.locale ?? undefined
	});
</script>

<!-- Client only: the library builds its content with document.createElement. -->
{#if browser}
	<div class="cal">
		<Calendar
			plugins={[DayGrid, TimeGrid, List, ResourceTimeGrid, ResourceTimeline, Interaction]}
			{options}
		>
			{#snippet noEventsContent()}
				<span class="none">Nothing scheduled in this range.</span>
			{/snippet}
		</Calendar>
	</div>
{/if}

<style>
	.cal {
		flex: 1;
		min-height: 0;
	}

	.none {
		color: var(--muted);
	}

	/* The library's own tokens, pointed at ours. `color-scheme` has to be handed back:
	   .ec pins it to light, which would strip light-dark() from everything inside. */
	.cal :global(.ec) {
		color-scheme: inherit;
		--ec-bg-color: var(--surface);
		--ec-text-color: var(--ink);
		--ec-border-color: var(--border);
		--ec-color-300: var(--border);
		--ec-color-200: var(--surface-2);
		--ec-color-100: var(--surface-2);
		--ec-color-50: var(--surface);
		--ec-button-bg-color: var(--surface);
		--ec-button-border-color: var(--border);
		--ec-button-text-color: var(--ink);
		--ec-button-active-bg-color: var(--surface-2);
		--ec-button-active-border-color: var(--border-bright);
		--ec-today-bg-color: color-mix(in oklab, var(--accent) 7%, var(--surface));
		--ec-highlight-color: color-mix(in oklab, var(--accent) 12%, var(--surface));
		--ec-event-bg-color: var(--accent);
		--ec-event-text-color: var(--accent-ink);
		--ec-now-indicator-color: var(--danger);
		--ec-popup-bg-color: var(--surface);
		font-size: 0.92em;
	}

	/* Past due with work outstanding — the one thing a chip has to shout. */
	.cal :global(.ec-event.late) {
		outline: 1px solid var(--danger);
		outline-offset: -1px;
	}

	.cal :global(.ec-event) {
		cursor: pointer;
	}
</style>
