import React from 'react';

const AgentStatusBar = ({ agents }) => {
  const statusColors = { online: "#10B981", standby: "#F59E0B", offline: "#EF4444" };
  
  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '12px 20px',
      background: '#141414',
      borderBottom: '1px solid #27272F',
      overflowX: 'auto',
      scrollbarWidth: 'none'
    }}>
      {agents.map(agent => (
        <div 
          key={agent.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            background: '#0a0a0a',
            border: `1px solid ${agent.status === 'online' ? agent.color + '44' : '#27272F'}`,
            borderRadius: '8px',
            minWidth: 'fit-content',
            opacity: agent.status === 'offline' ? 0.5 : 1
          }}
        >
          <div style={{ 
            width: '6px', 
            height: '6px', 
            borderRadius: '50%', 
            background: statusColors[agent.status || 'standby'],
            boxShadow: agent.status === 'online' ? `0 0 6px ${statusColors.online}` : 'none'
          }} />
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: agent.color + '22',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 800,
            color: agent.color
          }}>
            {agent.initials}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#E4E4E7' }}>{agent.name}</span>
            <span style={{ fontSize: '9px', color: '#71717A', textTransform: 'uppercase' }}>{agent.status || 'standby'}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AgentStatusBar;
