import './App.css'

import { ChatRoom } from './component/ChatRoom.tsx'

function App () {
  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 600, margin: '2rem auto' }}>
      <h1>⚛️ Chat gRPC — React + Python</h1>
      <ChatRoom myName={'test'}/>
    </main>
  )
}

export default App
