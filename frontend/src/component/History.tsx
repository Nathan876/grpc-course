import { useEffect, useState } from 'react'
import { client } from '../grpc/client'
import { HistoryRequest } from '../generated/chat_pb.js'

export function History () {
  const [messages, setMessages] = useState<string[]>([])

  const loadHistory = () => {
    setMessages([])
    // Requête : l'historique de Mounir (RPC History attend un HistoryRequest : user + limit)
    const request = new HistoryRequest({ user: 'Mounir', limit: 50 })
    const controller = new AbortController()

    // Le stream reste ouvert : à chaque message reçu, on ajoute à l'état React
    void (async () => {
      try {
        for await (const msg of client.history(request, { signal: controller.signal })) {
          setMessages((prev) => [...prev, `[${msg.timestamp}] ${msg.user}: ${msg.text}`])
        }
        console.log('Stream terminé')
      } catch (err) {
        if (controller.signal.aborted) return
        console.error('Erreur stream :', err)
      }
    })()

    // Nettoyage : si le composant est démonté, on FERME le flux
    return () => controller.abort()
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
