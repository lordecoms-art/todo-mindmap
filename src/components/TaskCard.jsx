import { useRef } from 'react';
import { STATUS_COLORS, STATUS_LABELS } from '../utils/constants';

/**
 * Ligne de tâche dans ListView avec swipe pour changer de statut
 * @param {{ task: Object, projId: string, projColor: string, onCycleStatus: Function, onEditTask: Function, onDeleteTask: Function }} props
 */
export default function TaskCard({ task, projId, projColor, onCycleStatus, onEditTask, onDeleteTask, index, onDragStart, onDragOver, onDrop }) {
  const touchStart = useRef(null);
  const swipeRef = useRef(null);

  const handleTouchStart = (e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;

    // Only swipe if horizontal movement > 60px and more horizontal than vertical
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (swipeRef.current) {
        swipeRef.current.style.transform = '';
        swipeRef.current.style.transition = 'transform 0.3s ease';
      }
      onCycleStatus(projId, task.id);
    }
  };

  const handleTouchMove = (e) => {
    if (!touchStart.current || !swipeRef.current) return;
    const dx = e.touches[0].clientX - touchStart.current.x;
    if (Math.abs(dx) > 20) {
      swipeRef.current.style.transition = 'none';
      swipeRef.current.style.transform = `translateX(${dx * 0.3}px)`;
    }
  };

  return (
    <div
      ref={swipeRef}
      className={`task-card ${task.status === 'done' ? 'task-done' : ''}`}
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
      onDrop={onDrop}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button className="task-status-btn"
        onClick={() => onCycleStatus(projId, task.id)}
        style={{ borderColor: STATUS_COLORS[task.status], background: task.status === 'done' ? STATUS_COLORS[task.status] : 'transparent' }}>
        {task.status === 'done' && <span className="checkmark">&#10003;</span>}
        {task.status === 'inprogress' && <div className="status-dot" style={{ background: STATUS_COLORS[task.status] }} />}
      </button>

      <span className={`task-text ${task.status === 'done' ? 'text-done' : ''}`}>
        {task.text}
      </span>

      <span className="task-status-label" style={{ color: STATUS_COLORS[task.status] }}>
        {STATUS_LABELS[task.status]}
      </span>

      <button className="task-action-btn" onClick={() => onEditTask({ projId, task })}>&#9998;</button>
      <button className="task-action-btn" onClick={() => onDeleteTask(projId, task.id)}>&times;</button>
    </div>
  );
}
