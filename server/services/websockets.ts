import type Database from "/services/database.ts";

type SocketOptions = {
	database: Database;
	// bot: Bot;
}

export class Socket {
	static event_types: Array<keyof WebSocketEventMap> = ['close', 'error', 'message', 'open'] as const;

	#channels: Map<string, WebSocket>;
	#database: Database;

	constructor({ database }: SocketOptions) {
		this.#channels = new Map();
		this.#database = database;
	}

	use(req: Request, channel_id: string | null): Response {
		const { socket, response } = Deno.upgradeWebSocket(req);
		
		console.log('------ use new websocket ------');
		console.log(req.url);

		socket.addEventListener('open', (event) => {
			console.log('open', channel_id);
			if (!channel_id) {
				socket.send(JSON.stringify({
					type: 'error',
					message: 'no channel_id provided',
				}));
				socket.close(1008);
			} else {
				if (!this.#database.channels.has(channel_id)) {
					socket.send(JSON.stringify({
						type: 'error',
						message: `could not find a channel for channel_id '${channel_id}'`,
					}));
				} else {
					socket.send(JSON.stringify({
						type: 'notice',
						message: `successfully connected`,
					}));
					this.#channels.set(channel_id, socket);
				}
			}
		});

		socket.addEventListener('close', (event) => {
			console.log('close', channel_id);
		});

		socket.addEventListener('message', (event) => {
			console.log('message', channel_id, event.data);
		});

		socket.addEventListener('error', (event) => {
			console.error('error', channel_id);
		});

		return response;
	}

	get channels() {
		return this.#channels;
	}
}

// TODO: save all active sockets based on channel_id (?) which needs to be provided on connection
//			 and add broadcast option for a specific channel_id (?) from anywhere...