import React from 'react';

const ProjectsPanel = ({ projects, agents }) => {
  const getAgent = (id) => agents.find(a => a.id === id) || { name: id, color: "#71717A", initials: "??" };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '20px' }}>
      {projects.map(project => {
        const owner = getAgent(project.owner);
        return (
          <div 
            key={project.id}
            style={{ 
              background: '#141414', 
              borderRadius: '16px', 
              padding: '24px', 
              border: '1px solid #27272F',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Owner badge */}
            <div style={{ position: 'absolute', top: '24px', right: '24px', display: 'flex', gap: '4px' }}>
              {project.team.map(t => (
                <div key={t} style={{ 
                  width: '24px', 
                  height: '24px', 
                  borderRadius: '50%', 
                  background: getAgent(t).color + '33',
                  border: `1px solid ${getAgent(t).color}66`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 800,
                  color: getAgent(t).color
                }}>
                  {getAgent(t).initials}
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: project.type === 'milestone' ? '#f59e0b' : '#3B82F6', letterSpacing: '1px' }}>
                {project.type?.toUpperCase()}
              </span>
              <h3 style={{ margin: '8px 0', fontSize: '18px', color: '#E4E4E7' }}>{project.title}</h3>
              <p style={{ fontSize: '12px', color: '#A1A1AA', lineHeight: 1.5, margin: 0 }}>{project.description}</p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: '#71717A' }}>Progress</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#f59e0b' }}>{project.progress}%</span>
              </div>
              <div style={{ height: '6px', background: '#0a0a0a', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${project.progress}%`, 
                  background: `linear-gradient(90deg, ${owner.color}88, ${owner.color})`,
                  borderRadius: '3px'
                }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '9px', color: '#3F3F46', textTransform: 'uppercase' }}>Owner</span>
                  <span style={{ fontSize: '12px', color: owner.color, fontWeight: 700 }}>{owner.name}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '9px', color: '#3F3F46', textTransform: 'uppercase' }}>Deadline</span>
                  <span style={{ fontSize: '12px', color: '#E4E4E7' }}>{project.targetDate}</span>
                </div>
              </div>
              <button style={{ 
                padding: '8px 16px', 
                background: '#0a0a0a', 
                border: '1px solid #27272F', 
                borderRadius: '6px', 
                color: '#A1A1AA', 
                fontSize: '11px', 
                cursor: 'pointer' 
              }}>
                View Details
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectsPanel;
