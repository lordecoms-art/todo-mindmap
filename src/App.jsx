import { useState, useEffect } from 'react';
import MindmapView from './components/MindmapView';
import ListView from './components/ListView';
import SettingsView from './components/SettingsView';
import BottomNav from './components/BottomNav';
import Onboarding from './components/Onboarding';
import { useProjects } from './hooks/useProjects';
import { useLocalStorage } from './hooks/useLocalStorage';

export default function App() {
  const [view, setView] = useState('mindmap');
  const [theme, setTheme] = useLocalStorage('todo-mindmap-theme', 'dark');
  const [onboarded, setOnboarded] = useLocalStorage('todo-mindmap-onboarded', false);

  // Apply theme to <html> for CSS variables to cascade to body
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  const {
    projects, setProjects,
    cycleStatus, addTask, deleteTask, editTask, reorderTask,
    addProject, editProject, deleteProject,
  } = useProjects();

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleImport = (data) => {
    setProjects(data);
  };

  const handlers = {
    onCycleStatus: cycleStatus,
    onAddTask: addTask,
    onDeleteTask: deleteTask,
    onEditTask: editTask,
    onReorderTask: reorderTask,
    onAddProject: addProject,
    onEditProject: editProject,
    onDeleteProject: deleteProject,
  };

  const totalTasks = projects.reduce((a, p) => a + p.tasks.length, 0);
  const doneTasks = projects.reduce((a, p) => a + p.tasks.filter(t => t.status === 'done').length, 0);
  const inProgressTasks = projects.reduce((a, p) => a + p.tasks.filter(t => t.status === 'inprogress').length, 0);

  return (
    <div className="app" data-theme={theme}>
      {!onboarded && <Onboarding onComplete={() => setOnboarded(true)} />}

      <header className="app-header">
        <div className="header-row">
          <div className="logo">
            <div className="logo-icon">TM</div>
            <span className="logo-text">ToDo</span>
            <span className="logo-sub">Mindmap</span>
          </div>

          <div className="header-stats">
            <div className="stat-box cyan">
              <div className="stat-value">{projects.length}</div>
              <div className="stat-label">Projets</div>
            </div>
            <div className="stat-box purple">
              <div className="stat-value">{totalTasks}</div>
              <div className="stat-label">Tâches</div>
            </div>
            <div className="stat-box yellow">
              <div className="stat-value">{inProgressTasks}</div>
              <div className="stat-label">En cours</div>
            </div>
            <div className="stat-box green">
              <div className="stat-value">{doneTasks}/{totalTasks}</div>
              <div className="stat-label">Fait</div>
            </div>
          </div>
        </div>
        <div className="header-progress">
          <div className="header-progress-fill"
            style={{ width: `${totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}%` }} />
        </div>
      </header>

      <div className="view-container">
        <div key={view} className="view-slide">
          {view === 'mindmap' && <MindmapView projects={projects} {...handlers} />}
          {view === 'list' && <ListView projects={projects} {...handlers} />}
          {view === 'settings' && (
            <SettingsView theme={theme} onToggleTheme={toggleTheme}
              projects={projects} onImport={handleImport} />
          )}
        </div>
      </div>

      <BottomNav view={view} onChangeView={setView} />
    </div>
  );
}
