import { useState } from "react";
import { client } from "../grpc/client";
import { ChatMessage } from '../generated/chat_pb.ts' // le stub du 3.5

export function SendMessage() {
  const [text, setText] = useState("");
  const [ack, setAck] = useState("");
  const [error, setError] = useState("");
  const metadata = { "x-request-id": "abc-123" };

  // L'appel unary : l'équivalent du stub.SendMessage() de Python !
  const send = async () => {
    setError(""); setAck("");
    // 1. On construit la requête avec la classe générée (constructeur par objet)
    const request = new ChatMessage({
      user: "Mounir",
      text,
      timestamp: new Date().toISOString()
    });

    try {
      // 2. L'appel RPC — "unary" = 1 requête, 1 réponse
      const response = await client.sendMessage(request, { headers: metadata });
      // 3. On lit la réponse TYPÉE (le champ .text existe grâce au .proto)
      setAck(response.text);
      setText("");
    } catch (err: any) {
      // 4. Les erreurs gRPC arrivent ici — mêmes codes que Python ! (Module 2, 2.5)
      setError(`${err.code} : ${err.message}`);
    }
  };

  return (
    <div>
      <h2>Envoyer un message (unary)</h2>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Votre message"
      />
      <button onClick={send}>Envoyer</button>
      {ack && <p style={{ color: "green" }}>{ack}</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
