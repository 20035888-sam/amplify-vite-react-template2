import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";

const client = generateClient<Schema>();

type Todo = Schema["Todo"]["type"];
type Priority = "low" | "medium" | "high";

const VALID_PRIORITIES: Priority[] = ["low", "medium", "high"];

interface TaskForm {
  content: string;
  priority: Priority;
}

function App() {
  const [todos, setTodos] = useState<Array<Todo>>([]);
  const [form, setForm] = useState<TaskForm>({ content: "", priority: "medium" });
  const [filter, setFilter] = useState<"all" | "active" | "done">("all");

  // FIX 2: Unsubscribe on unmount to prevent memory leak
  useEffect(() => {
    const sub = client.models.Todo.observeQuery().subscribe({
      next: (data) => setTodos([...data.items]),
    });
    return () => sub.unsubscribe();
  }, []);

  function createTodo() {
    if (!form.content.trim()) return;
    client.models.Todo.create({
      content: form.content.trim(),
      priority: form.priority,
      completed: false,
    });
    setForm({ content: "", priority: "medium" });
  }

  function toggleTodo(todo: Todo) {
    client.models.Todo.update({ id: todo.id, completed: !todo.completed });
  }

  function deleteTodo(id: string) {
    client.models.Todo.delete({ id });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") createTodo();
  }

  // FIX 3: Safe priority resolver — no silent cast failures
  function resolvePriority(raw: string | null | undefined): Priority {
    return VALID_PRIORITIES.includes(raw as Priority) ? (raw as Priority) : "medium";
  }

  const filtered = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "done") return t.completed;
    return true;
  });

  const doneCount = todos.filter((t) => t.completed).length;

  const priorityColor: Record<Priority, string> = {
    low: "#4ade80",
    medium: "#facc15",
    high: "#f87171",
  };

  return (
    <>
      {/* FIX 4: @import moved out of component-injected <style> to avoid parse-order issues.
          Add this to your index.html <head> instead:
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
          <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet" />
      */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --bg: #0f0f0f;
          --surface: #1a1a1a;
          --surface2: #242424;
          --border: #2e2e2e;
          --text: #f0ece4;
          --muted: #6b6b6b;
          --accent: #c8f060;
          --low: #4ade80;
          --medium: #facc15;
          --high: #f87171;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'DM Mono', monospace;
          min-height: 100vh;
        }

        .app {
          max-width: 680px;
          margin: 0 auto;
          padding: 3rem 1.5rem 6rem;
        }

        /* Header */
        .header {
          margin-bottom: 3rem;
        }

        .header-top {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .title {
          font-family: 'Syne', sans-serif;
          font-size: 2.8rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1;
          color: var(--text);
        }

        .title span {
          color: var(--accent);
        }

        .stats {
          font-size: 0.75rem;
          color: var(--muted);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .progress-bar {
          height: 2px;
          background: var(--border);
          border-radius: 99px;
          overflow: hidden;
          margin-top: 1.25rem;
        }

        .progress-fill {
          height: 100%;
          background: var(--accent);
          border-radius: 99px;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Input Area */
        .input-area {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .input-row {
          display: flex;
          gap: 0.75rem;
          align-items: center;
        }

        .task-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          font-family: 'DM Mono', monospace;
          font-size: 0.9rem;
          color: var(--text);
          /* FIX 1: Removed invalid placeholder-color property */
        }

        /* FIX 1: This is the correct way to style placeholder text */
        .task-input::placeholder { color: var(--muted); }

        .priority-row {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .priority-label {
          font-size: 0.7rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-right: 0.25rem;
        }

        .priority-btn {
          padding: 0.3rem 0.75rem;
          border-radius: 99px;
          border: 1px solid var(--border);
          background: transparent;
          font-family: 'DM Mono', monospace;
          font-size: 0.7rem;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.15s;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .priority-btn.active-low  { border-color: var(--low);    color: var(--low);    background: rgba(74,222,128,0.08); }
        .priority-btn.active-medium { border-color: var(--medium); color: var(--medium); background: rgba(250,204,21,0.08); }
        .priority-btn.active-high { border-color: var(--high);   color: var(--high);   background: rgba(248,113,113,0.08); }

        .add-btn {
          background: var(--accent);
          color: #0f0f0f;
          border: none;
          border-radius: 8px;
          padding: 0.5rem 1.1rem;
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.1s;
          white-space: nowrap;
        }

        .add-btn:hover { opacity: 0.85; }
        .add-btn:active { transform: scale(0.97); }

        /* Filters */
        .filters {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }

        .filter-btn {
          padding: 0.35rem 0.9rem;
          border-radius: 99px;
          border: 1px solid var(--border);
          background: transparent;
          font-family: 'DM Mono', monospace;
          font-size: 0.75rem;
          color: var(--muted);
          cursor: pointer;
          transition: all 0.15s;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .filter-btn.active {
          background: var(--surface2);
          border-color: var(--text);
          color: var(--text);
        }

        /* Task List */
        .task-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .task-item {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.9rem 1rem;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 10px;
          transition: border-color 0.2s, opacity 0.2s;
          animation: slideIn 0.2s ease;
        }

        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .task-item:hover { border-color: #3e3e3e; }
        .task-item.done  { opacity: 0.45; }

        .priority-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .checkbox {
          width: 18px;
          height: 18px;
          border-radius: 5px;
          border: 1.5px solid var(--border);
          background: transparent;
          cursor: pointer;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }

        .checkbox.checked {
          background: var(--accent);
          border-color: var(--accent);
        }

        .checkbox.checked::after {
          content: '';
          display: block;
          width: 5px;
          height: 9px;
          border: 2px solid #0f0f0f;
          border-top: none;
          border-left: none;
          transform: rotate(45deg) translateY(-1px);
        }

        .task-content {
          flex: 1;
          font-size: 0.88rem;
          color: var(--text);
          line-height: 1.4;
          word-break: break-word;
        }

        .task-content.done {
          text-decoration: line-through;
          color: var(--muted);
        }

        .delete-btn {
          background: transparent;
          border: none;
          color: var(--muted);
          cursor: pointer;
          font-size: 1rem;
          line-height: 1;
          padding: 0.25rem;
          border-radius: 4px;
          transition: color 0.15s, background 0.15s;
          flex-shrink: 0;
          opacity: 0;
        }

        .task-item:hover .delete-btn { opacity: 1; }
        .delete-btn:hover { color: var(--high); background: rgba(248,113,113,0.1); }

        /* Empty State */
        .empty {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--muted);
          font-size: 0.85rem;
          letter-spacing: 0.04em;
        }

        .empty-icon {
          font-size: 2.5rem;
          margin-bottom: 0.75rem;
          display: block;
        }
      `}</style>

      <div className="app">
        {/* Header */}
        <div className="header">
          <div className="header-top">
            <h1 className="title">task<span>.</span></h1>
            <span className="stats">{doneCount}/{todos.length} done</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: todos.length ? `${(doneCount / todos.length) * 100}%` : "0%" }}
            />
          </div>
        </div>

        {/* Input */}
        <div className="input-area">
          <div className="input-row">
            <input
              className="task-input"
              placeholder="Add a new task..."
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              onKeyDown={handleKeyDown}
            />
            <button className="add-btn" onClick={createTodo}>+ Add</button>
          </div>
          <div className="priority-row">
            <span className="priority-label">Priority</span>
            {(["low", "medium", "high"] as Priority[]).map((p) => (
              <button
                key={p}
                className={`priority-btn ${form.priority === p ? `active-${p}` : ""}`}
                onClick={() => setForm({ ...form, priority: p })}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="filters">
          {(["all", "active", "done"] as const).map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div className="task-list">
          {filtered.length === 0 ? (
            <div className="empty">
              <span className="empty-icon">✦</span>
              {filter === "done" ? "Nothing completed yet." : "No tasks here. Add one above."}
            </div>
          ) : (
            filtered.map((todo) => {
              // FIX 3: Safe priority resolution — no silent cast failures
              const priority = resolvePriority(todo.priority);
              return (
                <div key={todo.id} className={`task-item ${todo.completed ? "done" : ""}`}>
                  <div
                    className="priority-dot"
                    style={{ background: priorityColor[priority] }}
                  />
                  <div
                    className={`checkbox ${todo.completed ? "checked" : ""}`}
                    onClick={() => toggleTodo(todo)}
                  />
                  <span className={`task-content ${todo.completed ? "done" : ""}`}>
                    {todo.content}
                  </span>
                  <button className="delete-btn" onClick={() => deleteTodo(todo.id)}>✕</button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

export default App;
