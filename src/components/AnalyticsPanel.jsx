import React from 'react';

const AnalyticsPanel = () => {
  const stats = [
    { label: "Total Tasks", value: "142", trend: "+12%", color: "#3B82F6" },
    { label: "Completion Rate", value: "94%", trend: "+2%", color: "#10B981" },
    { label: "Content Units", value: "28", trend: "+5", color: "#EC4899" },
    { label: "API Uptime", value: "99.9%", trend: "0%", color: "#f59e0b" },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        {stats.map(stat => (
          <div key={stat.label} style={{ background: '#141414', borderRadius: '16px', padding: '24px', border: '1px solid #27272F' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#71717A', letterSpacing: '1px', marginBottom: '12px', textTransform: 'uppercase' }}>{stat.label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#E4E4E7' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: stat.trend.startsWith('+') ? '#10B981' : '#71717A' }}>{stat.trend}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts area mockup */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <div style={{ background: '#141414', borderRadius: '16px', padding: '24px', border: '1px solid #27272F', height: '300px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#E4E4E7' }}>System Performance (Weekly)</h4>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '12px', paddingBottom: '20px' }}>
            {[40, 60, 45, 90, 65, 80, 70].map((h, i) => (
              <div key={i} style={{ flex: 1, height: `${h}%`, background: 'linear-gradient(180deg, #f59e0b 0%, #f59e0b22 100%)', borderRadius: '4px' }}></div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #27272F', paddingTop: '12px' }}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <span key={day} style={{ fontSize: '10px', color: '#71717A' }}>{day}</span>
            ))}
          </div>
        </div>

        <div style={{ background: '#141414', borderRadius: '16px', padding: '24px', border: '1px solid #27272F', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#E4E4E7' }}>Agent Efficiency</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { name: 'JARVIS', val: 98 },
              { name: 'FORGE', val: 85 },
              { name: 'ATLAS', val: 92 },
              { name: 'SCRIBE', val: 78 }
            ].map(agent => (
              <div key={agent.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#A1A1AA' }}>{agent.name}</span>
                  <span style={{ fontSize: '11px', color: '#E4E4E7' }}>{agent.val}%</span>
                </div>
                <div style={{ height: '4px', background: '#0a0a0a', borderRadius: '2px' }}>
                  <div style={{ width: `${agent.val}%`, height: '100%', background: '#f59e0b', borderRadius: '2px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
