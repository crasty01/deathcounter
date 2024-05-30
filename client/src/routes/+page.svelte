<script lang="ts" >
	import { goto } from '$app/navigation'

	let input = '';
	$: disabled = input.length < 3;

	const handle_navigate = () => {
		if (disabled) return;

		goto(`/channel/${input}`)
	}
</script>


<main class="grid place-content-center min-h-[100vh] w-full">
	<section class="flex flex-col gap-8">
		<label for="channel_name" class="flex flex-col gap-2">
			<span>channel name:</span>
			<input bind:value={input} type="text" name="channel_name" id="channel_name" class="bg-surface-700 rounded-md px-2 py-1">
		</label>
		<button {disabled} on:click={handle_navigate}
			class="flex flex-row gap-2 px-2 py-1 items-center justify-center group w-full rounded-md text-surface-900 transition-colors
			{disabled ? 'bg-surface-400' : 'bg-primary-400  hover:bg-primary-500'}">
			<span>go</span>
			<iconify-icon icon="ic:baseline-arrow-forward" class="{disabled ? '' : 'group-hover:translate-x-2 transition-transform'}"></iconify-icon>
		</button>
	</section>
</main>