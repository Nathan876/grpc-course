import './App.css'

import { Login } from './component/Login.tsx'

function App () {
  return (
    <main style={{ fontFamily: 'sans-serif', maxWidth: 600, margin: '2rem auto' }}>
      <h1>⚛️ Chat gRPC — React + Python</h1>
      <Login/>
    </main>
  )
}

export default App
