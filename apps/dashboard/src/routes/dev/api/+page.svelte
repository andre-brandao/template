<script lang="ts">
	import { doc } from './api.remote';

	const spec = $derived(await doc());
</script>

<div class="intro">
	<h1>API explorer</h1>
	<p>
		The {spec.list.length} operations <code>{spec.base}</code> serves, read from the live Hono routes rather than the
		checked-in <code>packages/sdk/openapi.json</code>.
	</p>
	<p>
		Requests run against the app in-process — nothing has to be listening on port 3000, and there
		is no CORS in the way. Auth is real: pick one of your <code>sk-</code> keys and it resolves
		through the same middleware an external client hits.
	</p>
	<p class="hint">Pick an operation from the list.</p>
</div>
