import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessage, HistoryRequest } from "../generated/chat_pb";
import { client } from "../grpc/client";

// La forme d'un message côté UI (découplé du type protobuf)
export interface UiMessage {
  id: number;
  user: string;
  text: string;
  timestamp: string;
  mine: boolean;        // true = envoyé par MOI (pour styliser à droite)
}

export function useChat(myName: string) {
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const counter = useRef(0);          // compteur d'ids uniques, survit aux re-renders

  // ⚠️ grpc-web ne génère QUE des méthodes Unary et Server Streaming pour le
  // navigateur : il n'y a pas de client.chat() (bidirectionnel) ni de
  // client.uploadBatch() (client streaming). On simule le "temps réel" en
  // rechargeant l'historique (Server Streaming) au montage et après chaque envoi.
  const loadHistory = useCallback(() => {
    setMessages([]);
    // History attend un HistoryRequest (user + limit), pas un ChatMessage
    const request = new HistoryRequest().setUser(myName).setLimit(50);
    const stream = client.history(request, {});

    stream.on("data", (msg: ChatMessage) => {
      const mine = msg.getUser() === myName;
      setMessages((prev) => [
        ...prev,
        {
          id: ++counter.current,          // id unique pour la key React
          user: msg.getUser(),
          text: msg.getText(),
          timestamp: msg.getTimestamp(),
          mine,
        },
      ]);
    });

    stream.on("error", (err) => {
      setConnected(false);
      setError(`Connexion perdue : ${err.message}`);
    });

    return stream;
  }, [myName]);

  // ---------- CONNEXION : on charge l'historique au montage ----------
  useEffect(() => {
    setConnected(true);
    const stream = loadHistory();

    // Nettoyage au démontage : on FERME le flux (règle d'or du Module 3)
    return () => {
      stream.cancel();
    };
  }, [loadHistory]);     // si myName change, on se reconnecte

  // ---------- ENVOI : appel unary, puis rechargement de l'historique ----------
  const send = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const msg = new ChatMessage()
      .setUser(myName)
      .setText(text)
      .setTimestamp(new Date().toISOString());

      client.sendMessage(msg, {})
        .then(() => loadHistory())
        .catch((err) => setError(`Envoi échoué : ${err.message}`));
    },
    [myName, loadHistory]
  );

  return { messages, send,
    connected, error };
}
