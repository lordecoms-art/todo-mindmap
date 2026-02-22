import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { INITIAL_PROJECTS, STATUS_CYCLE, genId, PROJECT_EMOJIS } from '../utils/constants';

/**
 * Hook CRUD pour projets + tâches, persistés en localStorage
 */
export function useProjects() {
  const [projects, setProjects] = useLocalStorage('todo-mindmap-data', INITIAL_PROJECTS);

  const cycleStatus = useCallback((projId, taskId) => {
    setProjects(prev => prev.map(p => p.id === projId ? {
      ...p,
      tasks: p.tasks.map(t => t.id === taskId ? {
        ...t,
        status: STATUS_CYCLE[(STATUS_CYCLE.indexOf(t.status) + 1) % STATUS_CYCLE.length],
      } : t),
    } : p));
  }, [setProjects]);

  const addTask = useCallback((projId, text) => {
    setProjects(prev => prev.map(p => p.id === projId ? {
      ...p,
      tasks: [...p.tasks, { id: genId(), text, status: 'todo' }],
    } : p));
  }, [setProjects]);

  const deleteTask = useCallback((projId, taskId) => {
    setProjects(prev => prev.map(p => p.id === projId ? {
      ...p,
      tasks: p.tasks.filter(t => t.id !== taskId),
    } : p));
  }, [setProjects]);

  const editTask = useCallback((projId, taskId, text) => {
    setProjects(prev => prev.map(p => p.id === projId ? {
      ...p,
      tasks: p.tasks.map(t => t.id === taskId ? { ...t, text } : t),
    } : p));
  }, [setProjects]);

  const reorderTask = useCallback((projId, fromIndex, toIndex) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== projId) return p;
      const tasks = [...p.tasks];
      const [moved] = tasks.splice(fromIndex, 1);
      tasks.splice(toIndex, 0, moved);
      return { ...p, tasks };
    }));
  }, [setProjects]);

  const addProject = useCallback((name, priority, color) => {
    setProjects(prev => [...prev, {
      id: genId(),
      name,
      emoji: PROJECT_EMOJIS[Math.floor(Math.random() * PROJECT_EMOJIS.length)],
      priority,
      color,
      tasks: [],
    }]);
  }, [setProjects]);

  const editProject = useCallback((projId, name, priority, color) => {
    setProjects(prev => prev.map(p => p.id === projId ? { ...p, name, priority, color } : p));
  }, [setProjects]);

  const deleteProject = useCallback((projId) => {
    setProjects(prev => prev.filter(p => p.id !== projId));
  }, [setProjects]);

  return {
    projects,
    setProjects,
    cycleStatus,
    addTask,
    deleteTask,
    editTask,
    reorderTask,
    addProject,
    editProject,
    deleteProject,
  };
}
