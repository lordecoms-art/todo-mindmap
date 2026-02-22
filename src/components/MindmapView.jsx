import { useState, useRef, useCallback, useEffect } from 'react';
import Modal from './Modal';
import { CentralNode, ProjectNode, TaskNode } from './MindmapNode';
import { PRIORITY_LABELS, PRIORITY_COLORS, PROJECT_COLORS } from '../utils/constants';

/**
 * Vue mindmap SVG interactive avec zoom, pan, drag, et touch gestures
 */
export default function MindmapView({ projects, onCycleStatus, onAddTask, onDeleteTask, onEditTask, onAddProject, onEditProject, onDeleteProject }) {
  const containerRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.5 });
  const [dragging, setDragging] = useState(null);
  const [nodePositions, setNodePositions] = useState({});
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const pinchStart = useRef(null);

  const [editTaskModal, setEditTaskModal] = useState(null);
  const [editProjectModal, setEditProjectModal] = useState(null);
  const [addTaskModal, setAddTaskModal] = useState(null);
  const [addProjectModal, setAddProjectModal] = useState(false);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState('normal');
  const [editColor, setEditColor] = useState('#FF6B6B');

  const projectRadius = 400;

  const getProjectPos = useCallback((index, total) => {
    const angle = (2 * Math.PI * index) / total - Math.PI / 2;
    return { x: projectRadius * Math.cos(angle), y: projectRadius * Math.sin(angle) };
  }, []);

  const getTaskPos = useCallback((projPos, taskIndex, totalTasks, projIndex, totalProjects) => {
    const baseAngle = (2 * Math.PI * projIndex) / totalProjects - Math.PI / 2;
    const spread = Math.PI / (Math.max(totalTasks, 2) + 1);
    const startAngle = baseAngle - (spread * (totalTasks - 1)) / 2;
    const angle = startAngle + spread * taskIndex;
    const taskRadius = Math.max(250, totalTasks * 80);
    return { x: projPos.x + taskRadius * Math.cos(angle), y: projPos.y + taskRadius * Math.sin(angle) };
  }, []);

  const getNodePos = useCallback((key, defaultPos) => nodePositions[key] || defaultPos, [nodePositions]);

  // Mouse wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setTransform(prev => ({ ...prev, scale: Math.max(0.15, Math.min(3, prev.scale * delta)) }));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // Auto-fit zoom on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (!container || projects.length === 0) return;
      let minX = -65, maxX = 65, minY = -65, maxY = 65;
      projects.forEach((proj, pi) => {
        const pp = getProjectPos(pi, projects.length);
        minX = Math.min(minX, pp.x - 120); maxX = Math.max(maxX, pp.x + 120);
        minY = Math.min(minY, pp.y - 45); maxY = Math.max(maxY, pp.y + 45);
        proj.tasks.forEach((_, ti) => {
          const tp = getTaskPos(pp, ti, proj.tasks.length, pi, projects.length);
          minX = Math.min(minX, tp.x - 120); maxX = Math.max(maxX, tp.x + 120);
          minY = Math.min(minY, tp.y - 40); maxY = Math.max(maxY, tp.y + 40);
        });
      });
      const cw = maxX - minX + 60, ch = maxY - minY + 60;
      const s = Math.min(container.clientWidth / cw, container.clientHeight / ch, 1);
      setTransform({ x: 0, y: 0, scale: Math.max(s, 0.15) });
    });
    return () => cancelAnimationFrame(frame);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mouse pan
  const handleMouseDown = useCallback((e) => {
    if (e.target === containerRef.current || e.target.tagName === 'svg' || e.target.tagName === 'SVG') {
      setIsPanning(true);
      panStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
    }
  }, [transform]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      setTransform(prev => ({ ...prev, x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y }));
    }
    if (dragging) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.width / 2 - transform.x) / transform.scale;
      const y = (e.clientY - rect.height / 2 - transform.y) / transform.scale;
      setNodePositions(prev => ({ ...prev, [dragging]: { x, y } }));
    }
  }, [isPanning, dragging, transform]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setDragging(null);
  }, []);

  // Touch: pan + pinch-to-zoom
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStart.current = { dist: Math.sqrt(dx * dx + dy * dy), scale: transform.scale };
      return;
    }
    if (e.touches.length === 1 && !dragging) {
      const touch = e.touches[0];
      if (e.target === containerRef.current || e.target.tagName === 'svg' || e.target.tagName === 'SVG') {
        setIsPanning(true);
        panStart.current = { x: touch.clientX - transform.x, y: touch.clientY - transform.y };
      }
    }
  }, [transform, dragging]);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2 && pinchStart.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const newScale = pinchStart.current.scale * (dist / pinchStart.current.dist);
      setTransform(prev => ({ ...prev, scale: Math.max(0.15, Math.min(3, newScale)) }));
      return;
    }
    if (isPanning && e.touches.length === 1) {
      const touch = e.touches[0];
      setTransform(prev => ({ ...prev, x: touch.clientX - panStart.current.x, y: touch.clientY - panStart.current.y }));
    }
    if (dragging && e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = containerRef.current.getBoundingClientRect();
      const x = (touch.clientX - rect.width / 2 - transform.x) / transform.scale;
      const y = (touch.clientY - rect.height / 2 - transform.y) / transform.scale;
      setNodePositions(prev => ({ ...prev, [dragging]: { x, y } }));
    }
  }, [isPanning, dragging, transform]);

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    setDragging(null);
    pinchStart.current = null;
  }, []);

  const curvedPath = (x1, y1, x2, y2) => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1;
    return `M${x1},${y1} Q${mx - dy * 0.15},${my + dx * 0.15} ${x2},${y2}`;
  };

  const allLines = [];
  const allNodes = [];
  const centralPos = getNodePos('central', { x: 0, y: 0 });

  allNodes.push(<CentralNode key="central" pos={centralPos} onDragStart={setDragging} />);

  projects.forEach((proj, pi) => {
    const defaultProjPos = getProjectPos(pi, projects.length);
    const projPos = getNodePos(proj.id, defaultProjPos);

    allLines.push(
      <path key={`line-c-${proj.id}`} d={curvedPath(centralPos.x, centralPos.y, projPos.x, projPos.y)}
        fill="none" stroke={proj.color} strokeWidth={2} opacity={0.5} strokeDasharray="6 4" />
    );

    allNodes.push(
      <ProjectNode key={`proj-${proj.id}`} proj={proj} pos={projPos}
        onDragStart={setDragging}
        onEditProject={(p) => {
          setEditProjectModal(p);
          setEditText(p.name);
          setEditPriority(p.priority);
          setEditColor(p.color);
        }}
        onAddTask={(id) => { setAddTaskModal(id); setEditText(''); }} />
    );

    proj.tasks.forEach((task, ti) => {
      const defaultTaskPos = getTaskPos(projPos, ti, proj.tasks.length, pi, projects.length);
      const taskKey = `${proj.id}-${task.id}`;
      const taskPos = getNodePos(taskKey, defaultTaskPos);

      allLines.push(
        <path key={`line-${taskKey}`} d={curvedPath(projPos.x, projPos.y, taskPos.x, taskPos.y)}
          fill="none" stroke={proj.color} strokeWidth={2} opacity={0.5} strokeDasharray="4 3" />
      );

      allNodes.push(
        <TaskNode key={`task-${taskKey}`} task={task} proj={proj} pos={taskPos}
          taskKey={taskKey} onDragStart={setDragging}
          onCycleStatus={onCycleStatus} onDeleteTask={onDeleteTask}
          onEditTask={(data) => { setEditTaskModal(data); setEditText(data.task.text); }} />
      );
    });
  });

  return (
    <div ref={containerRef} className="mindmap-container"
      style={{ cursor: isPanning ? 'grabbing' : 'default' }}
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
        <g transform={`translate(${transform.x + (containerRef.current?.clientWidth || window.innerWidth) / 2}, ${transform.y + (containerRef.current?.clientHeight || window.innerHeight) / 2}) scale(${transform.scale})`}>
          {allLines}
          {allNodes}
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
