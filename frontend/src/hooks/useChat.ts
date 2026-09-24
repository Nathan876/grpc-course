import { useCallback, useEffect, useRef, useState } from "react";
import { ChatMessage } from "../generated/Chat_pb";
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

  // ---------- CONNEXION : on ouvre le flux DESCENDANT une seule fois ----------
  useEffect(() => {
    // Requête "d'entrée" : qui je suis (le serveur m'enregistre)
    const hello = new ChatMessage().setUser(myName).setText("__join__");

    // bidirectional : renvoie un objet avec .on("data") ET .write()
    const stream = client.history(hello, {})
    setConnected(true);

    // Chaque message POUSSÉ par le serveur (broadcast du Module 2, §2.3)
    stream.on("data", (msg: ChatMessage) => {
      // On détecte si c'est moi qui l'ai envoyé (le serveur le broadcaste à tous, moi compris)
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

    stream.on("end", () => setConnected(false));

    // Nettoyage au démontage : on FERME le flux (règle d'or du Module 3)
    return () => {
      stream.cancel();
      setConnected(false);
    };
  }, [myName]);     // si myName change, on se reconnecte

  // ---------- ENVOI : chaque message part dans le flux MONTANT ----------
  const send = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      const msg = new ChatMessage()
      .setUser(myName)
      .setText(text)
      .setTimestamp(new Date().toISOString());

      // Écrit dans le flux montant. Côté grpc-web, write() met en file
      // et le message part dès que le canal le permet.
      streamRef.current?.write(msg);
    },
    [myName]
  );

  return { messages, send, connected, error };
}
