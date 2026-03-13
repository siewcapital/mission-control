import React, { useState, useEffect } from 'react';

const CalendarView = ({ events, agents }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  
  // Get today's info
  const today = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-11
  const currentMonthName = currentDate.toLocaleString('default', { month: 'long' });
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0-6 (Sun-Sat)
  
  // Generate days array
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptySlots = Array.from({ length: firstDayOfMonth }, (_, i) => i);
  
  const getAgent = (id) => agents.find(a => a.id === id) || { 
    name: id || 'System', 
    color: "#71717A", 
    initials: id ? id.substring(0, 2).toUpperCase() : "SY"
  };
  
  // Get events for a specific day
  const getEventsForDay = (day) => {
    return events.filter(e => e.day === day);
  };
  
  // Check if a day is today
  const isToday = (day) => {
    return day === today.getDate() && 
           currentMonth === today.getMonth() && 
           currentYear === today.getFullYear();
  };
  
  // Get today's events for the sidebar
  const todaysEvents = events.filter(e => e.day === today.getDate());

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', height: '100%' }}>
      {/* Calendar Grid */}
      <div style={{ background: '#141414', borderRadius: '16px', padding: '24px', border: '1px solid #27272F' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#E4E4E7' }}>
            {currentMonthName} {currentYear}
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setCurrentDate(new Date(currentYear, currentMonth - 1, 1))}
              style={{ padding: '6px 12px', background: '#0a0a0a', border: '1px solid #27272F', color: '#E4E4E7', borderRadius: '6px', cursor: 'pointer' }}
            >
              Prev
            </button>
            <button 
              onClick={() => setCurrentDate(new Date(currentYear, currentMonth + 1, 1))}
              style={{ padding: '6px 12px', background: '#0a0a0a', border: '1px solid #27272F', color: '#E4E4E7', borderRadius: '6px', cursor: 'pointer' }}
            >
              Next
            </button>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 800, color: '#71717A', padding: '8px 0' }}>
              {day}
            </div>
          ))}
          
          {/* Empty slots for days before 1st */}
          {emptySlots.map((_, i) => (
            <div key={`empty-${i}`} style={{ aspectRatio: '1/1' }} />
          ))}
          
          {/* Actual days */}
          {days.map(day => {
            const dayEvents = getEventsForDay(day);
            const todayFlag = isToday(day);
            
            return (
              <div 
                key={day} 
                style={{ 
                  aspectRatio: '1/1', 
                  background: todayFlag ? '#f59e0b20' : '#0a0a0a', 
                  border: `1px solid ${todayFlag ? '#f59e0b' : '#27272F'}`,
                  borderRadius: '8px',
                  padding: '8px',
                  position: 'relative',
                  cursor: 'pointer'
                }}
              >
                <span style={{ 
                  fontSize: '11px', 
                  fontWeight: todayFlag ? 800 : 400, 
                  color: todayFlag ? '#f59e0b' : '#E4E4E7' 
                }}>
                  {day}
                </span>
                
                {/* Event dots */}
                {dayEvents.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '2px', 
                    marginTop: '4px',
                    maxHeight: '20px',
                    overflow: 'hidden'
                  }}>
                    {dayEvents.slice(0, 4).map((e, i) => (
                      <div 
                        key={i} 
                        style={{ 
                          width: '4px', 
                          height: '4px', 
                          borderRadius: '50%', 
                          background: getAgent(e.agent).color 
                        }} 
                      />
                    ))}
                    {dayEvents.length > 4 && (
                      <span style={{ fontSize: '8px', color: '#71717A' }}>+</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Schedule List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ 
          background: '#141414', 
          borderRadius: '16px', 
          padding: '20px', 
          border: '1px solid #27272F', 
          flex: 1,
          maxHeight: '500px',
          overflow: 'auto'
        }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#f59e0b', letterSpacing: '1px' }}>
            TODAY - {today.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()}
          </h4>
          
          {todaysEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#71717A' }}>
              No scheduled tasks for today
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {todaysEvents
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((event, i) => {
                  const agent = getAgent(event.agent);
                  return (
                    <div 
                      key={i} 
                      style={{ 
                        display: 'flex', 
                        gap: '12px', 
                        alignItems: 'flex-start', 
                        padding: '12px', 
                        background: '#0a0a0a', 
                        borderRadius: '8px', 
                        border: '1px solid #27272F' 
                      }}
                    >
                      <div style={{ 
                        fontSize: '11px', 
                        fontWeight: 700, 
                        color: '#f59e0b', 
                        minWidth: '45px',
                        fontFamily: 'monospace'
                      }}>
                        {event.time}
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: '#E4E4E7', marginBottom: '4px', lineHeight: 1.4 }}>
                          {event.task}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <div style={{ 
                            width: '8px', 
                            height: '8px', 
                            borderRadius: '2px', 
                            background: agent.color 
                          }} />
                          <span style={{ fontSize: '10px', color: '#71717A' }}>
                            {agent.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div style={{ background: '#141414', borderRadius: '16px', padding: '16px', border: '1px solid #27272F' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#71717A' }}>AGENTS</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {agents.slice(0, 6).map(agent => (
              <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: agent.color }} />
                <span style={{ fontSize: '10px', color: '#A1A1AA' }}>{agent.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
