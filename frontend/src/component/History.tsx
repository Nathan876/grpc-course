import { useEffect, useState } from 'react'
import { client } from '../grpc/client'
import { ChatMessage, HistoryRequest } from '../generated/chat_pb.js'

export function History () {
  const [messages, setMessages] = useState<string[]>([])

  const loadHistory = () => {
    setMessages([])
    // Requête : l'historique de Mounir (RPC History attend un HistoryRequest : user + limit)
    const request = new HistoryRequest().setUser('Mounir').setLimit(50)

    // Le stream reste ouvert : à chaque message reçu, on ajoute à l'état React
    const stream = client.history(request, {})
    stream.on('data', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, `[${msg.getTimestamp()}] ${msg.getUser()}: ${msg.getText()}`])
    })
    stream.on('error', (err) => console.error('Erreur stream :', err))
    stream.on('end', () => console.log('Stream terminé'))

    // Nettoyage : si le composant est démonté, on FERME le flux
    return () => stream.cancel()
  }

  useEffect(() => {
    const cancelStream = loadHistory()

    return () => {
      if (cancelStream) cancelStream()
    }
  }, [])   // [] = une seule souscription au montage du composant

  return (
    <div>
      <h2>Historique (server streaming)</h2>
      <button onClick={loadHistory}>Actualiser</button>
      <ul>{messages.map((m, i) => <li key={i}>{m}</li>)}</ul>
    </div>
  )
}
