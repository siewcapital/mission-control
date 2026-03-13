import React from 'react';

const Sidebar = ({ activeView, setActiveView, views }) => {
  return (
    <div style={{
      width: '240px',
      height: '100vh',
      background: '#141414',
      borderRight: '1px solid #27272F',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0
    }}>
      <div style={{ padding: '24px', borderBottom: '1px solid #27272F' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B98166' }} />
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.5px' }}>Siew's Capital</span>
        </div>
        <div style={{ fontSize: '10px', color: '#71717A', marginTop: '4px', letterSpacing: '1px', textTransform: 'uppercase' }}>Mission Control</div>
      </div>
      
      <div style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
        {views.map(view => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            style={{
              width: '100%',
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: activeView === view.id ? '#f59e0b10' : 'transparent',
              border: 'none',
              borderLeft: `3px solid ${activeView === view.id ? '#f59e0b' : 'transparent'}`,
              color: activeView === view.id ? '#f59e0b' : '#A1A1AA',
              fontSize: '13px',
              fontWeight: activeView === view.id ? 700 : 400,
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'inherit',
              transition: 'all 0.2s'
            }}
          >
            <span style={{ fontSize: '16px' }}>{view.icon}</span>
            {view.label}
          </button>
        ))}
      </div>
      
      <div style={{ padding: '16px', borderTop: '1px solid #27272F' }}>
        <div style={{ fontSize: '10px', color: '#3F3F46', textAlign: 'center' }}>
          v3.1 · OpenClaw Powered
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
