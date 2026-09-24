import { useEffect, useState } from 'react'
import { client } from '../grpc/client'
import { ChatMessage } from '../generated/chat_pb.js'

export function History () {
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    // Requête : l'historique de Mounir (RPC History du Module 2)
    const request = new ChatMessage().setUser('Mounir')

    // Le stream reste ouvert : à chaque message reçu, on ajoute à l'état React
    const stream = client.history(request, {})
    stream.on('data', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, `[${msg.getTimestamp()}] ${msg.getText()}`])
    })
    stream.on('error', (err) => console.error('Erreur stream :', err))
    stream.on('end', () => console.log('Stream terminé'))

    // Nettoyage : si le composant est démonté, on FERME le flux
    return () => stream.cancel()
  }, [])   // [] = une seule souscription au montage du composant

  return (
    <div>
      <h2>Historique (server streaming)</h2>
      <ul>{messages.map((m, i) => <li key={i}>{m}</li>)}</ul>
    </div>
  )
}
