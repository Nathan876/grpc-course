import { ChatServiceClient } from "../generated/ChatServiceClientPb";
// ↑ le stub client GÉNÉRÉ au 3.3 — équivalent du UserServiceStub Python

// Adresse du PROXY Envoy (8080), PAS du serveur Python (50052) !
// En dev : Vite sert sur 5173, on passe par le proxy pour éviter le CORS.
export const client = new ChatServiceClient(
  "http://localhost:8080",     // si Envoy tourne à côté de Vite, sinon "/api"
  null,                        // credentials (null = pas d'auth pour l'instant)
  null                         // options avancées (null = défauts)
);
