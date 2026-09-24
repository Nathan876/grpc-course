import { useCallback, useEffect, useRef, useState } from 'react'
import { ChatMessage, HistoryRequest } from '../generated/chat_pb'
import { client } from '../grpc/client'
import { grpcErrorMessage } from '../grpc/errors.ts'

export interface UiMessage {
  id: number;
  user: string;
  text: string;
  timestamp: string;
  mine: boolean;
}

// Entre deux onglets sur le même myName, gRPC-web ne peut rien pousser tout
// seul (pas de bidi côté navigateur) : on rafraîchit l'historique à
// intervalle régulier pour simuler le "temps réel".
const POLL_INTERVAL_MS = 4000

export function useChat (myName: string) {
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')
  const [retryable, setRetryable] = useState(false)
  const counter = useRef(0)
  const streamRef = useRef<any>(null)
  const lastActionRef = useRef<(() => void) | null>(null)

  const loadHistory = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.cancel()
    }

    setMessages([])
    const request = new HistoryRequest().setUser(myName).setLimit(50)

    const stream = client.history(request, {})
    streamRef.current = stream
    setConnected(true)

    stream.on('data', (msg: ChatMessage) => {
      const mine = msg.getUser() === myName
      setMessages((prev) => [
        ...prev,
        {
          id: ++counter.current,
          user: msg.getUser(),
          text: msg.getText(),
          timestamp: msg.getTimestamp(),
          mine
        }
      ])
    })

    stream.on('error', (err: any) => {
      setConnected(false)
      const { message, retryable } = grpcErrorMessage(err)
      setError(message)
      setRetryable(retryable)
      lastActionRef.current = () => loadHistory()
    })

    return stream
  }, [myName])

  useEffect(() => {
    setConnected(true)
    const stream = loadHistory()
    const poll = setInterval(loadHistory, POLL_INTERVAL_MS)

    return () => {
      clearInterval(poll)
      if (stream) stream.cancel()
    }
  }, [loadHistory])

  const send = useCallback(
    (text: string) => {
      if (!text.trim()) return
      setError('')
      const msg = new ChatMessage()
      .setUser(myName)
      .setText(text)
      .setTimestamp(new Date().toISOString())

      client.sendMessage(msg, {})
      .then(() => loadHistory())
      .catch((err: any) => {
        const { message, retryable } = grpcErrorMessage(err)
        setError(message)
        setRetryable(retryable)
        lastActionRef.current = () => send(text)
      })
    },
    [myName, loadHistory]
  )

  const retry = useCallback(() => {
    setError('')
    setRetryable(false)
    lastActionRef.current?.()
  }, [])

  return {
    messages,
    send,
    connected,
    error,
    retryable,
    retry
  }
}