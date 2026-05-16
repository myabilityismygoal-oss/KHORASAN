import React, { useEffect, useState } from 'react'

type Todo = {
  id: string
  text: string
  completed: boolean
  createdAt: number
}

const STORAGE_KEY = 'horasan_todos_v1'

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [text, setText] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  // Load from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setTodos(JSON.parse(raw))
    } catch (err) {
      console.error('Failed to load todos from localStorage', err)
    }
  }, [])

  // Persist on todos change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
    } catch (err) {
      console.error('Failed to save todos to localStorage', err)
    }
  }, [todos])

  function addTodo(e?: React.FormEvent) {
    e?.preventDefault()
    const value = text.trim()
    if (!value) return
    const newTodo: Todo = { id: uid(), text: value, completed: false, createdAt: Date.now() }
    setTodos(prev => [newTodo, ...prev])
    setText('')
  }

  function toggle(id: string) {
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }

  function remove(id: string) {
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  function clearCompleted() {
    setTodos(prev => prev.filter(t => !t.completed))
  }

  const filtered = todos.filter(t => (filter === 'all' ? true : filter === 'active' ? !t.completed : t.completed))

  return (
    <section className="todo-root" aria-labelledby="todo-heading">
      <h2 id="todo-heading" className="sr-only">To‑do</h2>

      <form onSubmit={addTodo} className="todo-form">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a new task..."
          aria-label="Add a new task"
        />
        <button type="submit">Add</button>
      </form>

      <div className="controls">
        <div className="filters">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'active' ? 'active' : ''} onClick={() => setFilter('active')}>Active</button>
          <button className={filter === 'completed' ? 'active' : ''} onClick={() => setFilter('completed')}>Completed</button>
        </div>
        <div className="actions">
          <button onClick={clearCompleted} disabled={!todos.some(t => t.completed)}>Clear completed</button>
        </div>
      </div>

      <ul className="todo-list">
        {filtered.length === 0 && <li className="empty">No tasks</li>}
        {filtered.map(todo => (
          <li key={todo.id} className={todo.completed ? 'done' : ''}>
            <label>
              <input type="checkbox" checked={todo.completed} onChange={() => toggle(todo.id)} />
              <span className="text">{todo.text}</span>
            </label>
            <div className="meta">
              <small>{new Date(todo.createdAt).toLocaleString()}</small>
              <button className="delete" aria-label={`Delete ${todo.text}`} onClick={() => remove(todo.id)}>✕</button>
            </div>
          </li>
        ))}
      </ul>

      <div className="summary">
        <span>{todos.filter(t => !t.completed).length} items left</span>
        <button onClick={() => setTodos([])}>Reset all</button>
      </div>
    </section>
  )
}
