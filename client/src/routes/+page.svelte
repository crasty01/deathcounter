<script lang="ts">
	// import { enhance } from '$app/forms';
	// import type { SubmitFunction } from './$types';

	// const handle_form: SubmitFunction = ({

	// }) => {};
	// use:enhance={handle_form}
</script>

<form action="?/get_channel" method="POST">
	<label for="channel_name">
		<span>channel name:</span>
		<input type="text" name="channel_name" id="channel_name">
	</label>
	<button type="submit">submit</button>
</form>