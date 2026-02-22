import { useState, useRef, useCallback, useEffect } from 'react';
import Modal from './Modal';
import { STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, PROJECT_COLORS } from '../utils/constants';

/**
 * Vue mindmap SVG entièrement refaite — layout radial, gros noeuds,
 * connexions pleines, expand/collapse, tap-to-cycle, double-tap recenter.
 */
export default function MindmapView({ projects, onCycleStatus, onAddTask, onDeleteTask, onEditTask, onAddProject, onEditProject, onDeleteProject }) {
  const containerRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const pinchStart = useRef(null);
  const lastTap = useRef(0);
  const [expanded, setExpanded] = useState(() => {
    const init = {};
    projects.forEach(p => { init[p.id] = true; });
    return init;
  });

  // Modals
  const [editTaskModal, setEditTaskModal] = useState(null);
  const [editProjectModal, setEditProjectModal] = useState(null);
  const [addTaskModal, setAddTaskModal] = useState(null);
  const [addProjectModal, setAddProjectModal] = useState(false);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState('normal');
  const [editColor, setEditColor] = useState('#FF6B6B');

  // Layout constants
  const projectRadius = Math.max(200, projects.length * 50);
  const taskRadius = 140;

  // ─── Position calculations ───────────────────────────────────
  const getProjectPos = useCallback((index, total) => {
    const angle = (2 * Math.PI * index) / total - Math.PI / 2;
    return { x: projectRadius * Math.cos(angle), y: projectRadius * Math.sin(angle) };
  }, [projectRadius]);

  const getTaskPos = useCallback((projPos, taskIndex, totalTasks, projIndex, totalProjects) => {
    const baseAngle = (2 * Math.PI * projIndex) / totalProjects - Math.PI / 2;
    const spread = Math.min(Math.PI * 0.8, Math.PI / Math.max(totalTasks, 1));
    const startAngle = baseAngle - (spread * (totalTasks - 1)) / 2;
    const angle = startAngle + spread * taskIndex;
    return {
      x: projPos.x + taskRadius * Math.cos(angle),
      y: projPos.y + taskRadius * Math.sin(angle),
    };
  }, [taskRadius]);

  // ─── Auto-fit on mount & project changes ─────────────────────
  const fitToView = useCallback(() => {
    const container = containerRef.current;
    if (!container || projects.length === 0) return;
    let minX = -50, maxX = 50, minY = -50, maxY = 50;
    projects.forEach((proj, pi) => {
      const pp = getProjectPos(pi, projects.length);
      minX = Math.min(minX, pp.x - 80); maxX = Math.max(maxX, pp.x + 80);
      minY = Math.min(minY, pp.y - 40); maxY = Math.max(maxY, pp.y + 40);
      if (expanded[proj.id]) {
        proj.tasks.forEach((_, ti) => {
          const tp = getTaskPos(pp, ti, proj.tasks.length, pi, projects.length);
          minX = Math.min(minX, tp.x - 70); maxX = Math.max(maxX, tp.x + 70);
          minY = Math.min(minY, tp.y - 30); maxY = Math.max(maxY, tp.y + 30);
        });
      }
    });
    const cw = maxX - minX + 40, ch = maxY - minY + 40;
    const s = Math.min(container.clientWidth / cw, container.clientHeight / ch, 1.2);
    setTransform({ x: 0, y: 0, scale: Math.max(s, 0.2) });
  }, [projects, expanded, getProjectPos, getTaskPos]);

  useEffect(() => {
    const frame = requestAnimationFrame(fitToView);
    return () => cancelAnimationFrame(frame);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Wheel zoom ──────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setTransform(prev => ({ ...prev, scale: Math.max(0.15, Math.min(4, prev.scale * delta)) }));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // ─── Mouse pan ───────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.mm-node-interactive')) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  }, [transform]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return;
    setTransform(prev => ({ ...prev, x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y }));
  }, [isPanning]);

  const handleMouseUp = useCallback(() => { setIsPanning(false); }, []);

  // ─── Touch: pan + pinch-to-zoom + double-tap ────────────────
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStart.current = { dist: Math.sqrt(dx * dx + dy * dy), scale: transform.scale };
      return;
    }
    if (e.target.closest('.mm-node-interactive')) return;
    if (e.touches.length === 1) {
      // Double tap detection
      const now = Date.now();
      if (now - lastTap.current < 300) {
        fitToView();
        lastTap.current = 0;
        return;
      }
      lastTap.current = now;
      setIsPanning(true);
      panStart.current = { x: e.touches[0].clientX - transform.x, y: e.touches[0].clientY - transform.y };
    }
  }, [transform, fitToView]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && pinchStart.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const newScale = pinchStart.current.scale * (dist / pinchStart.current.dist);
      setTransform(prev => ({ ...prev, scale: Math.max(0.15, Math.min(4, newScale)) }));
      return;
    }
    if (isPanning && e.touches.length === 1) {
      setTransform(prev => ({
        ...prev,
        x: e.touches[0].clientX - panStart.current.x,
        y: e.touches[0].clientY - panStart.current.y,
      }));
    }
  }, [isPanning]);

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    pinchStart.current = null;
  }, []);

  // ─── Toggle expand/collapse ──────────────────────────────────
  const toggleExpand = useCallback((projId) => {
    setExpanded(prev => ({ ...prev, [projId]: !prev[projId] }));
  }, []);

  // ─── Bézier curve ────────────────────────────────────────────
  const bezier = (x1, y1, x2, y2) => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1;
    return `M${x1},${y1} Q${mx - dy * 0.12},${my + dx * 0.12} ${x2},${y2}`;
  };

  // ─── Build SVG elements ──────────────────────────────────────
  const lines = [];
  const nodes = [];
  const cx = 0, cy = 0;

  // Central node
  nodes.push(
    <g key="central">
      <circle cx={cx} cy={cy} r={45} fill="#1a1a2e" stroke="url(#centralGrad)" strokeWidth={3}
        style={{ filter: 'drop-shadow(0 0 18px rgba(78,205,196,0.35))' }} />
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#4ECDC4"
        style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700 }}>ToDo</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#A78BFA"
        style={{ fontFamily: "'Space Mono', monospace", fontSize: 11 }}>Mindmap</text>
    </g>
  );

  projects.forEach((proj, pi) => {
    const pp = getProjectPos(pi, projects.length);
    const isExpanded = expanded[proj.id];
    const doneTasks = proj.tasks.filter(t => t.status === 'done').length;
    const progress = proj.tasks.length ? doneTasks / proj.tasks.length : 0;

    // Line: central -> project (solid)
    lines.push(
      <path key={`lc-${proj.id}`} d={bezier(cx, cy, pp.x, pp.y)}
        fill="none" stroke={proj.color} strokeWidth={2.5} opacity={0.55} />
    );

    // Project node — big rectangle 140x65
    const pw = 140, ph = 65, prx = 16;
    nodes.push(
      <g key={`p-${proj.id}`} className="mm-node-interactive" style={{ cursor: 'pointer' }}
         onClick={() => toggleExpand(proj.id)}>
        <rect x={pp.x - pw / 2} y={pp.y - ph / 2} width={pw} height={ph} rx={prx}
          fill="#1a1a2e" stroke={proj.color} strokeWidth={2}
          style={{ filter: `drop-shadow(0 0 12px ${proj.color}33)` }} />
        {/* Emoji */}
        <text x={pp.x - pw / 2 + 22} y={pp.y + 6} textAnchor="middle" fontSize={22}>{proj.emoji}</text>
        {/* Name */}
        <text x={pp.x + 8} y={pp.y - 6} textAnchor="middle" fill="#fff"
          style={{ fontFamily: "'Outfit', sans-serif", fontSize: 13, fontWeight: 600 }}>
          {proj.name.length > 12 ? proj.name.slice(0, 11) + '…' : proj.name}
        </text>
        {/* Progress ring */}
        <circle cx={pp.x + pw / 2 - 18} cy={pp.y - ph / 2 + 18} r={10} fill="none"
          stroke="#333" strokeWidth={3} />
        <circle cx={pp.x + pw / 2 - 18} cy={pp.y - ph / 2 + 18} r={10} fill="none"
          stroke={proj.color} strokeWidth={3}
          strokeDasharray={`${progress * 62.8} 62.8`}
          strokeLinecap="round"
          transform={`rotate(-90 ${pp.x + pw / 2 - 18} ${pp.y - ph / 2 + 18})`} />
        {/* Task count */}
        <text x={pp.x + 8} y={pp.y + 14} textAnchor="middle" fill="#888"
          style={{ fontFamily: "'Space Mono', monospace", fontSize: 10 }}>
          {doneTasks}/{proj.tasks.length} tâches
        </text>
        {/* Expand indicator */}
        <text x={pp.x + pw / 2 - 18} y={pp.y + ph / 2 - 8} textAnchor="middle" fill="#666" fontSize={10}>
          {isExpanded ? '▲' : '▼'}
        </text>
        {/* Edit button */}
        <g onClick={(e) => {
          e.stopPropagation();
          setEditProjectModal(proj);
          setEditText(proj.name);
          setEditPriority(proj.priority);
          setEditColor(proj.color);
        }}>
          <rect x={pp.x - pw / 2} y={pp.y + ph / 2 - 24} width={28} height={24} rx={8}
            fill="transparent" />
          <text x={pp.x - pw / 2 + 14} y={pp.y + ph / 2 - 8} textAnchor="middle" fill="#666" fontSize={12}>&#9998;</text>
        </g>
        {/* Add task button */}
        <g onClick={(e) => { e.stopPropagation(); setAddTaskModal(proj.id); setEditText(''); }}>
          <rect x={pp.x + pw / 2 - 36} y={pp.y + ph / 2 - 24} width={28} height={24} rx={8}
            fill="transparent" />
          <text x={pp.x + pw / 2 - 22} y={pp.y + ph / 2 - 6} textAnchor="middle" fill="#666" fontSize={16}>+</text>
        </g>
      </g>
    );

    // Tasks (only if expanded)
    if (isExpanded) {
      proj.tasks.forEach((task, ti) => {
        const tp = getTaskPos(pp, ti, proj.tasks.length, pi, projects.length);
        const statusColor = STATUS_COLORS[task.status];
        const isDone = task.status === 'done';
        const tw = 120, th = 50, trx = 12;

        // Line: project -> task (solid)
        lines.push(
          <path key={`lt-${proj.id}-${task.id}`} d={bezier(pp.x, pp.y, tp.x, tp.y)}
            fill="none" stroke={proj.color} strokeWidth={1.8} opacity={isDone ? 0.25 : 0.45} />
        );

        nodes.push(
          <g key={`t-${proj.id}-${task.id}`} className="mm-node-interactive" style={{ cursor: 'pointer' }}
             onClick={() => onCycleStatus(proj.id, task.id)}>
            <rect x={tp.x - tw / 2} y={tp.y - th / 2} width={tw} height={th} rx={trx}
              fill={isDone ? '#0d0d18' : '#12121c'}
              stroke={isDone ? '#10B98155' : proj.color + '88'}
              strokeWidth={1.5}
              opacity={isDone ? 0.5 : 0.95}
              style={{ filter: task.status === 'inprogress' ? `drop-shadow(0 0 8px ${proj.color}33)` : 'none' }} />
            {/* Status dot */}
            <circle cx={tp.x - tw / 2 + 14} cy={tp.y - 4} r={5} fill={statusColor} />
            {/* Task text */}
            <text x={tp.x + 4} y={tp.y - 1} textAnchor="middle" fill={isDone ? '#555' : '#ccc'}
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11,
                textDecoration: isDone ? 'line-through' : 'none',
              }}>
              {task.text.length > 13 ? task.text.slice(0, 12) + '…' : task.text}
            </text>
            {/* Status label */}
            <text x={tp.x} y={tp.y + 16} textAnchor="middle" fill={statusColor}
              style={{ fontFamily: "'Space Mono', monospace", fontSize: 8 }}>
              {task.status === 'todo' ? 'À faire' : task.status === 'inprogress' ? 'En cours' : 'Fait'}
            </text>
            {/* Edit btn (top right) */}
            <g onClick={(e) => {
              e.stopPropagation();
              setEditTaskModal({ projId: proj.id, task });
              setEditText(task.text);
            }}>
              <rect x={tp.x + tw / 2 - 22} y={tp.y - th / 2} width={22} height={22} rx={6} fill="transparent" />
              <text x={tp.x + tw / 2 - 11} y={tp.y - th / 2 + 15} textAnchor="middle" fill="#555" fontSize={10}>&#9998;</text>
            </g>
            {/* Delete btn */}
            <g onClick={(e) => { e.stopPropagation(); onDeleteTask(proj.id, task.id); }}>
              <rect x={tp.x - tw / 2} y={tp.y - th / 2} width={22} height={22} rx={6} fill="transparent" />
              <text x={tp.x - tw / 2 + 11} y={tp.y - th / 2 + 15} textAnchor="middle" fill="#555" fontSize={11}>&times;</text>
            </g>
          </g>
        );
      });
    }
  });

  // ─── Render ──────────────────────────────────────────────────
  const cWidth = containerRef.current?.clientWidth || window.innerWidth;
  const cHeight = containerRef.current?.clientHeight || window.innerHeight;

  return (
    <div ref={containerRef} className="mindmap-container"
      style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}>

      <button className="btn-add-project mindmap-add-btn"
        onClick={() => { setAddProjectModal(true); setEditText(''); setEditPriority('normal'); setEditColor('#FF6B6B'); }}>
        + Projet
      </button>

      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="centralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ECDC4" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
        <g transform={`translate(${transform.x + cWidth / 2}, ${transform.y + cHeight / 2}) scale(${transform.scale})`}>
          {lines}
          {nodes}
        </g>
      </svg>

      {/* Edit task modal */}
      <Modal open={!!editTaskModal} onClose={() => setEditTaskModal(null)} title="Modifier la tâche">
        <input className="input" value={editText} onChange={e => setEditText(e.target.value)}
          placeholder="Texte de la tâche" autoFocus />
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => {
            if (editTaskModal && editText.trim()) {
              onEditTask(editTaskModal.projId, editTaskModal.task.id, editText.trim());
              setEditTaskModal(null);
            }
          }}>Sauvegarder</button>
          <button className="btn btn-secondary" onClick={() => setEditTaskModal(null)}>Annuler</button>
        </div>
      </Modal>

      {/* Add task modal */}
      <Modal open={!!addTaskModal} onClose={() => setAddTaskModal(null)} title="Ajouter une tâche">
        <input className="input" value={editText} onChange={e => setEditText(e.target.value)}
          placeholder="Nom de la tâche" autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && editText.trim()) { onAddTask(addTaskModal, editText.trim()); setAddTaskModal(null); } }} />
        <button className="btn btn-primary btn-full" onClick={() => {
          if (editText.trim()) { onAddTask(addTaskModal, editText.trim()); setAddTaskModal(null); }
        }}>Ajouter</button>
      </Modal>

      {/* Add project modal */}
      <Modal open={addProjectModal} onClose={() => setAddProjectModal(false)} title="Nouveau projet">
        <input className="input" value={editText} onChange={e => setEditText(e.target.value)}
          placeholder="Nom du projet" autoFocus />
        <div className="form-group">
          <label className="form-label">Priorité</label>
          <div className="priority-select">
            {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
              <button key={k} onClick={() => setEditPriority(k)} className="btn-priority"
                style={{
                  borderColor: editPriority === k ? PRIORITY_COLORS[k] : '#333',
                  background: editPriority === k ? PRIORITY_COLORS[k] + '22' : 'transparent',
                  color: editPriority === k ? PRIORITY_COLORS[k] : '#888',
                }}>{v}</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Couleur</label>
          <div className="color-select">
            {PROJECT_COLORS.map(c => (
              <div key={c} onClick={() => setEditColor(c)} className="color-dot"
                style={{ background: c, border: editColor === c ? '3px solid #fff' : '3px solid transparent' }} />
            ))}
          </div>
        </div>
        <button className="btn btn-gradient btn-full" onClick={() => {
          if (editText.trim()) { onAddProject(editText.trim(), editPriority, editColor); setAddProjectModal(false); }
        }}>Créer le projet</button>
      </Modal>

      {/* Edit project modal */}
      <Modal open={!!editProjectModal} onClose={() => setEditProjectModal(null)} title="Modifier le projet">
        <input className="input" value={editText} onChange={e => setEditText(e.target.value)}
          placeholder="Nom du projet" autoFocus />
        <div className="form-group">
          <label className="form-label">Priorité</label>
          <div className="priority-select">
            {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
              <button key={k} onClick={() => setEditPriority(k)} className="btn-priority"
                style={{
                  borderColor: editPriority === k ? PRIORITY_COLORS[k] : '#333',
                  background: editPriority === k ? PRIORITY_COLORS[k] + '22' : 'transparent',
                  color: editPriority === k ? PRIORITY_COLORS[k] : '#888',
                }}>{v}</button>
            ))}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Couleur</label>
          <div className="color-select">
            {PROJECT_COLORS.map(c => (
              <div key={c} onClick={() => setEditColor(c)} className="color-dot"
                style={{ background: c, border: editColor === c ? '3px solid #fff' : '3px solid transparent' }} />
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => {
            if (editProjectModal && editText.trim()) {
              onEditProject(editProjectModal.id, editText.trim(), editPriority, editColor);
              setEditProjectModal(null);
            }
          }}>Sauvegarder</button>
          <button className="btn btn-danger" onClick={() => {
            if (editProjectModal) { onDeleteProject(editProjectModal.id); setEditProjectModal(null); }
          }}>Supprimer</button>
        </div>
      </Modal>
    </div>
  );
}
