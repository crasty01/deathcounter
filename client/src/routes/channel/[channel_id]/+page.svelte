<script lang="ts">
	import { browser } from '$app/environment';
	import { PUBLIC_SOCKET_URL } from '$env/static/public';
	import type { PageData } from './$types';

	export let data: PageData;

	type Message = {
		type: 'notice';
		message: string;
	} | {
		type: 'death_update';
		value: PageData;
	}

	if (browser) {
		const url = new URL(`/${data.channel_id}`, PUBLIC_SOCKET_URL);
		const socket = new WebSocket(url);

		socket.addEventListener('open', () => {
			console.log('connection opened');
		});

		socket.addEventListener('error', (event) => {
			console.error('error:', event);
		});

		socket.addEventListener('message', (event) => {
			const message = JSON.parse(event.data) as Message;

			if (message.type === 'death_update') {
				data = message.value;
			}
		});

		socket.addEventListener('close', () => {
			console.log('connection closed');
		});
	}

	import { page } from '$app/stores';

	$: use_greenscreen = $page.url.searchParams.has('greenscreen');
</script>

<main class="grid place-content-center min-h-[100vh] w-full">
	<section class="grid place-items-center gap-4 py-10 px-8 {use_greenscreen ? 'bg-[#00ff00]' : 'bg-surface-900'} rounded-md">
		<img src="/bonfire.gif" alt="bonfire">
		<h1 class="text-4xl font-bold max-w-[16rem] w-full text-center">
			<span>{data.deaths}</span>
			<span>death{data.deaths === 1 ? '' : 's'}</span>
		</h1>
	</section>
</main>

<style lang="postcss">
	img {
		image-rendering: pixelated;
	}
</style>