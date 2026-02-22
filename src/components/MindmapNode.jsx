import { STATUS_COLORS, STATUS_LABELS, PRIORITY_COLORS } from '../utils/constants';

/**
 * Noeud projet dans la mindmap SVG
 */
export function ProjectNode({ proj, pos, onDragStart, onEditProject, onAddTask }) {
  return (
    <g style={{ cursor: 'grab' }}
       onMouseDown={(e) => { e.stopPropagation(); onDragStart(proj.id); }}
       onTouchStart={(e) => { e.stopPropagation(); onDragStart(proj.id); }}>
      <rect x={pos.x - 110} y={pos.y - 32} width={220} height={65} rx={14}
        fill="#1a1a2e" stroke={proj.color} strokeWidth={2}
        style={{ filter: `drop-shadow(0 0 15px ${proj.color}44)` }} />
      <text x={pos.x} y={pos.y - 6} textAnchor="middle" fontSize={20}>
        {proj.emoji}
      </text>
      <text x={pos.x} y={pos.y + 18} textAnchor="middle" fill="#fff"
        style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 600 }}>
        {proj.name}
      </text>
      <circle cx={pos.x + 95} cy={pos.y - 20} r={7}
        fill={PRIORITY_COLORS[proj.priority]} />
      <g style={{ cursor: 'pointer' }}
         onMouseDown={(e) => e.stopPropagation()}
         onTouchStart={(e) => e.stopPropagation()}
         onClick={(e) => { e.stopPropagation(); onEditProject(proj); }}>
        <circle cx={pos.x - 95} cy={pos.y - 20} r={9} fill="#333" stroke="#555" strokeWidth={1} />
        <text x={pos.x - 95} y={pos.y - 16} textAnchor="middle" fill="#aaa" fontSize={10}>&#9998;</text>
      </g>
      <g style={{ cursor: 'pointer' }}
         onMouseDown={(e) => e.stopPropagation()}
         onTouchStart={(e) => e.stopPropagation()}
         onClick={(e) => { e.stopPropagation(); onAddTask(proj.id); }}>
        <circle cx={pos.x + 95} cy={pos.y + 20} r={9} fill="#333" stroke="#555" strokeWidth={1} />
        <text x={pos.x + 95} y={pos.y + 24} textAnchor="middle" fill="#aaa" fontSize={14}>+</text>
      </g>
    </g>
  );
}

/**
 * Noeud tâche dans la mindmap SVG
 */
export function TaskNode({ task, proj, pos, onDragStart, onCycleStatus, onEditTask, onDeleteTask, taskKey }) {
  const statusColor = STATUS_COLORS[task.status];
  return (
    <g style={{ cursor: 'grab' }}
       onMouseDown={(e) => { e.stopPropagation(); onDragStart(taskKey); }}
       onTouchStart={(e) => { e.stopPropagation(); onDragStart(taskKey); }}>
      <rect x={pos.x - 110} y={pos.y - 30} width={220} height={60} rx={12}
        fill="#12121c" stroke={task.status === 'done' ? '#10B981' : proj.color}
        strokeWidth={1.5} opacity={task.status === 'done' ? 0.5 : 0.9}
        style={{ filter: task.status === 'inprogress' ? `drop-shadow(0 0 10px ${proj.color}44)` : 'none' }} />
      <text x={pos.x} y={pos.y - 4} textAnchor="middle" fill={task.status === 'done' ? '#666' : '#ccc'}
        style={{
          fontFamily: "'Outfit', sans-serif", fontSize: 13,
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
        }}>
        {task.text}
      </text>
      <g style={{ cursor: 'pointer' }}
         onMouseDown={(e) => e.stopPropagation()}
         onTouchStart={(e) => e.stopPropagation()}
         onClick={(e) => { e.stopPropagation(); onCycleStatus(proj.id, task.id); }}>
        <rect x={pos.x - 100} y={pos.y + 6} width={80} height={22} rx={4} fill="transparent" />
        <circle cx={pos.x - 90} cy={pos.y + 18} r={6} fill={statusColor} />
        <text x={pos.x - 80} y={pos.y + 22} fill={statusColor}
          style={{ fontFamily: "'Space Mono', monospace", fontSize: 10 }}>
          {STATUS_LABELS[task.status]}
        </text>
      </g>
      <g style={{ cursor: 'pointer' }}
         onMouseDown={(e) => e.stopPropagation()}
         onTouchStart={(e) => e.stopPropagation()}
         onClick={(e) => { e.stopPropagation(); onEditTask({ projId: proj.id, task }); }}>
        <text x={pos.x + 80} y={pos.y + 22} fill="#666" fontSize={11}>&#9998;</text>
      </g>
      <g style={{ cursor: 'pointer' }}
         onMouseDown={(e) => e.stopPropagation()}
         onTouchStart={(e) => e.stopPropagation()}
         onClick={(e) => { e.stopPropagation(); onDeleteTask(proj.id, task.id); }}>
        <text x={pos.x + 95} y={pos.y + 22} fill="#666" fontSize={11}>&times;</text>
      </g>
    </g>
  );
}

/**
 * Noeud central de la mindmap
 */
export function CentralNode({ pos, onDragStart }) {
  return (
    <g style={{ cursor: 'grab' }}
       onMouseDown={(e) => { e.stopPropagation(); onDragStart('central'); }}
       onTouchStart={(e) => { e.stopPropagation(); onDragStart('central'); }}>
      <circle cx={pos.x} cy={pos.y} r={65} fill="#1a1a2e"
        stroke="#4ECDC4" strokeWidth={2.5}
        style={{ filter: 'drop-shadow(0 0 20px rgba(78,205,196,0.4))' }} />
      <text x={pos.x} y={pos.y - 8} textAnchor="middle" fill="#4ECDC4"
        style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700 }}>ToDo</text>
      <text x={pos.x} y={pos.y + 12} textAnchor="middle" fill="#A78BFA"
        style={{ fontFamily: "'Space Mono', monospace", fontSize: 12 }}>Mindmap</text>
    </g>
  );
}
