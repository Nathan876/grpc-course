import './App.css'
import { SendMessage } from './component/SendMessage.tsx'
import { History } from './component/History.tsx'

function App () {
  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 600, margin: '2rem auto' }}>
      <h1>⚛️ Chat gRPC — React + Python</h1>
      <SendMessage/>
      <hr/>
      <History/>
    </main>
  )
}

export default App
