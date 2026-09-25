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

export function useChat (myName: string) {
  const [messages, setMessages] = useState<UiMessage[]>([])
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')
  const [retryable, setRetryable] = useState(false)
  const counter = useRef(0)
  const abortRef = useRef<AbortController | null>(null)
  const lastActionRef = useRef<(() => void) | null>(null)

  const loadHistory = useCallback(() => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setMessages([])
    const request = new HistoryRequest({ user: myName, limit: 50 })
    setConnected(true)

    void (async () => {
      try {
        for await (const msg of client.history(request, { signal: controller.signal })) {
          const mine = msg.user === myName
          setMessages((prev) => [
            ...prev,
            {
              id: ++counter.current,
              user: msg.user,
              text: msg.text,
              timestamp: msg.timestamp,
              mine
            }
          ])
        }
      } catch (err: any) {
        if (controller.signal.aborted) return
        setConnected(false)
        const { message, retryable } = grpcErrorMessage(err)
        setError(message)
        setRetryable(retryable)
        lastActionRef.current = () => loadHistory()
      }
    })()

    return () => controller.abort()
  }, [myName])

  useEffect(() => {
    setConnected(true)
    const cancel = loadHistory()

    return () => {
      cancel()
    }
  }, [loadHistory])

  const send = useCallback(
    async (text: string) => {
      if (!text.trim()) return
      setError('')
      const msg = new ChatMessage({
        user: myName,
        text,
        timestamp: new Date().toISOString()
      })

      const token = sessionStorage.getItem("jwt") ?? ""

      try {
        await client.sendMessage(msg, {
          headers: {
            authorization: `Bearer ${token}`,
            "x-request-id": "abc-123"
          }
        })

        loadHistory()
      } catch (err: any) {
        const { message, retryable } = grpcErrorMessage(err)
        setError(message)
        setRetryable(retryable)
        lastActionRef.current = () => send(text)
      }
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