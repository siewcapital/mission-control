import React from 'react';

const TeamDirectory = ({ agents }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
      {agents.map(agent => (
        <div 
          key={agent.id}
          style={{ 
            background: '#141414', 
            borderRadius: '16px', 
            padding: '24px', 
            border: '1px solid #27272F',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div style={{ 
            width: '64px', 
            height: '64px', 
            borderRadius: '16px', 
            background: agent.color + '22',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 800,
            color: agent.color,
            marginBottom: '16px'
          }}>
            {agent.initials}
          </div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#E4E4E7' }}>{agent.name}</h3>
          <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 700, marginBottom: '16px', letterSpacing: '0.5px' }}>{agent.role}</span>
          
          <p style={{ fontSize: '12px', color: '#A1A1AA', lineHeight: 1.5, margin: '0 0 20px 0' }}>
            {agent.desc || "Specialized AI agent member of Siew's Capital core team."}
          </p>

          <div style={{ width: '100%', display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {['Strategy', 'Ops', 'Growth'].map(tag => (
              <span key={tag} style={{ fontSize: '10px', color: '#71717A', background: '#0a0a0a', border: '1px solid #27272F', padding: '4px 8px', borderRadius: '4px' }}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamDirectory;
