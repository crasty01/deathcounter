import { io } from "socket.io-client";

export const socket = () => io('https://WeeklyPlumpOutcomes.danielvondra.repl.co')