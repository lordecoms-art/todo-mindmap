import { useState, useRef } from 'react';
import Modal from './Modal';
import TaskCard from './TaskCard';
import { PRIORITY_LABELS, PRIORITY_COLORS, PROJECT_COLORS } from '../utils/constants';

/**
 * Vue liste en grille de cartes avec filtres par priorité et drag & drop
 */
export default function ListView({ projects, onCycleStatus, onAddTask, onDeleteTask, onEditTask, onAddProject, onEditProject, onDeleteProject, onReorderTask }) {
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState({});
  const [addTaskModal, setAddTaskModal] = useState(null);
  const [editTaskModal, setEditTaskModal] = useState(null);
  const [addProjectModal, setAddProjectModal] = useState(false);
  const [editProjectModal, setEditProjectModal] = useState(null);
  const [editText, setEditText] = useState('');
  const [editPriority, setEditPriority] = useState('normal');
  const [editColor, setEditColor] = useState('#FF6B6B');
  const dragIndex = useRef(null);
  const dragOverIndex = useRef(null);
  const dragProjId = useRef(null);

  const toggleExpand = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  const filtered = filter === 'all' ? projects : projects.filter(p => p.priority === filter);

  const handleDragStart = (projId) => (index) => {
    dragIndex.current = index;
    dragProjId.current = projId;
  };

  const handleDragOver = (index) => {
    dragOverIndex.current = index;
  };

  const handleDrop = (projId) => () => {
    if (dragProjId.current === projId && dragIndex.current !== null && dragOverIndex.current !== null && dragIndex.current !== dragOverIndex.current) {
      onReorderTask(projId, dragIndex.current, dragOverIndex.current);
    }
    dragIndex.current = null;
    dragOverIndex.current = null;
    dragProjId.current = null;
  };

  return (
    <div className="list-container">
      <div className="filter-bar">
        {['all', 'urgent', 'important', 'normal'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`filter-btn ${filter === f ? 'filter-active' : ''}`}
            style={filter === f ? {
              background: f === 'all' ? 'linear-gradient(135deg, #4ECDC4, #A78BFA)' : PRIORITY_COLORS[f],
              color: '#000'
            } : {}}>
            {f === 'all' ? 'Tous' : PRIORITY_LABELS[f]}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button className="btn-add-project"
          onClick={() => { setAddProjectModal(true); setEditText(''); setEditPriority('normal'); setEditColor('#FF6B6B'); }}>
          + Projet
        </button>
      </div>

      <div className="projects-grid">
        {filtered.map(proj => {
          const isExpanded = expanded[proj.id] !== false;
          const doneTasks = proj.tasks.filter(t => t.status === 'done').length;
          const progress = proj.tasks.length ? Math.round((doneTasks / proj.tasks.length) * 100) : 0;

          return (
            <div key={proj.id} className="project-card" style={{ borderColor: proj.color + '33', boxShadow: `0 4px 20px ${proj.color}11` }}>
              <div className="project-header" onClick={() => toggleExpand(proj.id)}>
                <span className="project-emoji">{proj.emoji}</span>
                <div className="project-info">
                  <div className="project-name-row">
                    <span className="project-name">{proj.name}</span>
                    <span className="priority-badge" style={{
                      background: PRIORITY_COLORS[proj.priority] + '22',
                      color: PRIORITY_COLORS[proj.priority],
                    }}>{PRIORITY_LABELS[proj.priority]}</span>
                  </div>
                  <div className="progress-row">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        background: `linear-gradient(90deg, ${proj.color}, ${proj.color}88)`,
                        width: `${progress}%`,
                      }} />
                    </div>
                    <span className="progress-text">{doneTasks}/{proj.tasks.length}</span>
                  </div>
                </div>
                <button className="task-action-btn" onClick={(e) => {
                  e.stopPropagation();
                  setEditProjectModal(proj);
                  setEditText(proj.name);
                  setEditPriority(proj.priority);
                  setEditColor(proj.color);
                }}>&#9998;</button>
                <span className={`expand-arrow ${isExpanded ? 'expanded' : ''}`}>{'\u25BC'}</span>
              </div>

              {isExpanded && (
                <div className="project-tasks">
                  {proj.tasks.map((task, index) => (
                    <TaskCard key={task.id} task={task} projId={proj.id} projColor={proj.color}
                      index={index}
                      onCycleStatus={onCycleStatus}
                      onEditTask={(data) => { setEditTaskModal(data); setEditText(data.task.text); }}
                      onDeleteTask={onDeleteTask}
                      onDragStart={handleDragStart(proj.id)}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop(proj.id)} />
                  ))}
                  <button className="btn-add-task" onClick={() => { setAddTaskModal(proj.id); setEditText(''); }}>
                    + Ajouter une tâche
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add task modal */}
      <Modal open={!!addTaskModal} onClose={() => setAddTaskModal(null)} title="Ajouter une tâche">
        <input className="input" value={editText} onChange={e => setEditText(e.target.value)}
          placeholder="Nom de la tâche" autoFocus
          onKeyDown={e => { if (e.key === 'Enter' && editText.trim()) { onAddTask(addTaskModal, editText.trim()); setAddTaskModal(null); } }} />
        <button className="btn btn-primary btn-full" onClick={() => {
          if (editText.trim()) { onAddTask(addTaskModal, editText.trim()); setAddTaskModal(null); }
        }}>Ajouter</button>
      </Modal>

      {/* Edit task modal */}
      <Modal open={!!editTaskModal} onClose={() => setEditTaskModal(null)} title="Modifier la tâche">
        <input className="input" value={editText} onChange={e => setEditText(e.target.value)}
          placeholder="Texte de la tâche" autoFocus />
        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => {
            if (editTaskModal && editText.trim()) { onEditTask(editTaskModal.projId, editTaskModal.task.id, editText.trim()); setEditTaskModal(null); }
          }}>Sauvegarder</button>
          <button className="btn btn-secondary" onClick={() => setEditTaskModal(null)}>Annuler</button>
        </div>
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
            if (editProjectModal && editText.trim()) { onEditProject(editProjectModal.id, editText.trim(), editPriority, editColor); setEditProjectModal(null); }
          }}>Sauvegarder</button>
          <button className="btn btn-danger" onClick={() => {
            if (editProjectModal) { onDeleteProject(editProjectModal.id); setEditProjectModal(null); }
          }}>Supprimer</button>
        </div>
      </Modal>
    </div>
  );
}
