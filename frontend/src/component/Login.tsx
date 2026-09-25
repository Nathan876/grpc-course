import { useState } from 'react'
import { client } from '../grpc/client.ts'
import { LoginRequest } from '../generated/chat_pb'

export function Login () {
  const [name, setName] = useState('')

  const login = async () => {
    if (!name.trim()) return

    const request = new LoginRequest({ username: name })

    try {
      const response = await client.login(request)
      const token = response.token

      sessionStorage.setItem('jwt', token)
      sessionStorage.setItem('username', name)

      console.log(name, token)
    } catch (err: any) {
      alert('Erreur de connexion : ' + err.message)
    }
  }

  return (
    <div>
      <h2>Connexion</h2>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Votre message"
      />
      <button onClick={login}>Se connecter</button>
    </div>
  )
}