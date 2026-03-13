import React, { useState } from 'react';

const TaskBoard = ({ tasks, agents, onDrop, onAddTask }) => {
  const [newTask, setNewTask] = useState("");
  const columns = [
    { id: "inbox", label: "📥 INBOX", color: "#71717A" },
    { id: "assigned", label: "📌 ASSIGNED", color: "#F59E0B" },
    { id: "in-progress", label: "⚡ IN PROGRESS", color: "#3B82F6" },
    { id: "review", label: "👁 REVIEW", color: "#A855F7" },
    { id: "done", label: "✅ DONE", color: "#10B981" },
  ];

  const typeColors = { ops: "#71717A", dev: "#60A5FA", research: "#F59E0B", content: "#EC4899", design: "#A855F7" };
  const priorityColors = { high: "#EF4444", medium: "#F59E0B", low: "#52525B" };

  const getAgent = (id) => agents.find(a => a.id === id) || { name: id, color: "#71717A", initials: "??" };

  const handleDragStart = (e, id) => {
    e.dataTransfer.setData("taskId", id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    onDrop(taskId, status);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
        <input 
          value={newTask} 
          onChange={e => setNewTask(e.target.value)} 
          onKeyDown={e => e.key === "Enter" && (onAddTask(newTask), setNewTask(""))}
          placeholder="Delegate new task..." 
          style={{ 
            flex: 1, 
            padding: "12px 16px", 
            background: "#141414", 
            border: "1px solid #27272F", 
            borderRadius: "8px", 
            color: "#E4E4E7", 
            fontSize: "14px",
            fontFamily: 'inherit',
            outline: 'none'
          }} 
        />
        <button 
          onClick={() => (onAddTask(newTask), setNewTask(""))}
          style={{ 
            padding: "0 24px", 
            background: "#f59e0b", 
            border: "none", 
            borderRadius: "8px", 
            color: "#0a0a0a", 
            fontSize: "13px", 
            fontWeight: 700, 
            cursor: "pointer" 
          }}
        >
          DELEGATE
        </button>
      </div>

      <div style={{ display: "flex", gap: "16px", flex: 1, overflowX: "auto", paddingBottom: '16px' }}>
        {columns.map(col => (
          <div 
            key={col.id} 
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            style={{ 
              flex: "0 0 280px", 
              background: "#141414", 
              borderRadius: "12px", 
              padding: "16px",
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid #27272F'
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <span style={{ fontSize: "11px", fontWeight: 800, color: col.color, letterSpacing: "1px" }}>{col.label}</span>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#71717A", background: "#0a0a0a", padding: "2px 8px", borderRadius: "10px" }}>
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: 'auto' }}>
              {tasks.filter(t => t.status === col.id).map(task => {
                const agent = getAgent(task.assignee);
                return (
                  <div 
                    key={task.id} 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    style={{ 
                      background: "#0a0a0a", 
                      border: "1px solid #27272F", 
                      borderRadius: "10px", 
                      padding: "14px", 
                      cursor: "grab" 
                    }}
                  >
                    <div style={{ fontSize: "13px", color: "#E4E4E7", lineHeight: 1.5, marginBottom: "12px" }}>{task.title}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <span style={{ fontSize: "8px", fontWeight: 700, color: typeColors[task.type] || "#71717A", background: (typeColors[task.type] || "#71717A") + "22", padding: "2px 6px", borderRadius: "4px" }}>{task.type?.toUpperCase()}</span>
                        <span style={{ fontSize: "8px", fontWeight: 700, color: priorityColors[task.priority], background: priorityColors[task.priority] + "22", padding: "2px 6px", borderRadius: "4px" }}>{task.priority?.toUpperCase()}</span>
                      </div>
                      <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: agent.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 800, color: agent.color }}>
                        {agent.initials}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskBoard;
