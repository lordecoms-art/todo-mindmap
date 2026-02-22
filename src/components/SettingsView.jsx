import { useRef } from 'react';

/**
 * Écran Settings : thème, export/import JSON
 * @param {{ theme: string, onToggleTheme: () => void, projects: Array, onImport: (data: Array) => void }} props
 */
export default function SettingsView({ theme, onToggleTheme, projects, onImport }) {
  const fileInputRef = useRef(null);

  const handleExport = () => {
    const data = JSON.stringify(projects, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-mindmap-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (Array.isArray(data)) {
          onImport(data);
        }
      } catch { /* invalid JSON */ }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const totalTasks = projects.reduce((a, p) => a + p.tasks.length, 0);
  const doneTasks = projects.reduce((a, p) => a + p.tasks.filter(t => t.status === 'done').length, 0);

  return (
    <div className="settings-container">
      <h2 className="settings-title">Réglages</h2>

      <div className="settings-section">
        <h3 className="settings-section-title">Apparence</h3>
        <div className="settings-row" onClick={onToggleTheme}>
          <div>
            <div className="settings-label">Thème</div>
            <div className="settings-description">
              {theme === 'dark' ? 'Mode sombre activé' : 'Mode clair activé'}
            </div>
          </div>
          <div className={`theme-toggle ${theme === 'light' ? 'theme-light' : ''}`}>
            <div className="theme-toggle-knob" />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">Données</h3>
        <div className="settings-row" onClick={handleExport}>
          <div>
            <div className="settings-label">Exporter les données</div>
            <div className="settings-description">
              {projects.length} projets, {totalTasks} tâches ({doneTasks} terminées)
            </div>
          </div>
          <span className="settings-arrow">&#8594;</span>
        </div>
        <div className="settings-row" onClick={() => fileInputRef.current?.click()}>
          <div>
            <div className="settings-label">Importer des données</div>
            <div className="settings-description">Charger un fichier JSON de sauvegarde</div>
          </div>
          <span className="settings-arrow">&#8594;</span>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} hidden />
        </div>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">À propos</h3>
        <div className="settings-row">
          <div>
            <div className="settings-label">ToDo Mindmap</div>
            <div className="settings-description">v1.0.0 — App de productivité PWA</div>
          </div>
        </div>
      </div>
    </div>
  );
}
