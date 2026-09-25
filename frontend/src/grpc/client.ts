import { createGrpcWebTransport } from "@connectrpc/connect-web";
import { createPromiseClient } from "@connectrpc/connect";
import { ChatService } from "../generated/chat_connect";

// Adresse du PROXY Envoy (8080), PAS du serveur Python (50052) !
// En dev : Vite sert sur 5173, on passe par le proxy pour éviter le CORS.
const transport = createGrpcWebTransport({
  baseUrl: "http://localhost:8080",
});

export const client = createPromiseClient(ChatService, transport);
