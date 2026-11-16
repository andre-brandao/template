<!-- A type, urgency or state as a badge: its tone, its icon and its word, the same on every screen. -->
<script lang="ts">
	import { Badge } from '@template/ui';
	import type { Label } from '../labels';

	let { label }: { label: Label } = $props();
</script>

<Badge tone={label.tone}>
	<label.icon size={12} strokeWidth={2} aria-hidden="true" />{label.label}
</Badge>
