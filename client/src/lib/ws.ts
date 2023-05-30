import { io } from "socket.io-client";

export const socket = () => io('https://deathcounter-production.up.railway.app/')