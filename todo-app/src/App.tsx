import React from 'react'
import TodoApp from './components/TodoApp'

export default function App() {
  return (
    <div className="app-shell">
      <header>
        <h1>HORASAN — To‑Do</h1>
      </header>
      <main>
        <TodoApp />
      </main>
      <footer className="attribution">LocalStorage example • Built with React + TypeScript</footer>
    </div>
  )
}
