<script lang="ts">
	import { browser } from '$app/environment';
	import { PUBLIC_SOCKET_URL } from '$env/static/public';
	import type { PageData } from './$types';

	export let data: PageData;
	let time_of_reload: number | undefined = undefined;

	type Message = {
		type: 'notice';
		message: string;
	} | {
		type: 'death_update';
		value: PageData;
	}

	const reload = () => {
		console.log('reloading')
		location.reload();
	}

	if (browser) {
		const url = new URL(`/${data.channel_id}`, PUBLIC_SOCKET_URL);
		const socket = new WebSocket(url);

		socket.addEventListener('open', () => {
			console.log('connection opened');
		});

		socket.addEventListener('error', (event) => {
			console.error('error:', event);
			if (!time_of_reload) time_of_reload = Date.now() + 300_000; // 2min
		});

		socket.addEventListener('message', (event) => {
			const message = JSON.parse(event.data) as Message;

			if (message.type === 'death_update') {
				data = message.value;
			}
		});

		socket.addEventListener('close', () => {
			console.log('connection closed');
			if (!time_of_reload) time_of_reload = Date.now() + 300_000; // 2min
		});
	}

	import { page } from '$app/stores';
	import CountdownProvider from '$lib/components/CountdownProvider.svelte';

	$: use_greenscreen = $page.url.searchParams.has('greenscreen');
</script>

<main class="grid place-content-center min-h-[100vh] w-full">
	<section class="grid relative place-items-center gap-4 py-10 px-8 {use_greenscreen ? 'bg-[#00ff00]' : 'bg-surface-900'} rounded-md">
		{#if time_of_reload !== undefined}
			<div class="absolute text-sm top-0 right-0 flex flex-col gap-0 items-end">
				<span>connection to server lost</span>
				<CountdownProvider end_time={time_of_reload} on:completed={reload} let:ms_left>
				<div class="flex justify-between w-full">
					<span>⚠️</span>
					<span>reload in {Math.floor((ms_left < 0 ? 0 : ms_left) / 1000)}s</span>
				</div>
				</CountdownProvider>
			</div>
		{/if}
		<img src="/bonfire.gif" alt="bonfire">
		<h1 class="text-4xl font-bold max-w-[16rem] w-full text-center">
			<span>{data.deaths}</span>
			<span>death{data.deaths === 1 ? '' : 's'}</span>
		</h1>
	</section>
	<!-- <button on:click={() => time_of_reload = Date.now() + 300_000}>force reload</button> -->
</main>

<style lang="postcss">
	img {
		image-rendering: pixelated;
	}
</style>