/**
 * Barre de navigation bottom style app native
 * @param {{ view: string, onChangeView: (view: string) => void }} props
 */
export default function BottomNav({ view, onChangeView }) {
  const tabs = [
    { id: 'mindmap', icon: '\u{1F5FA}\uFE0F', label: 'Mindmap' },
    { id: 'list', icon: '\u{1F4CB}', label: 'Liste' },
    { id: 'settings', icon: '\u2699\uFE0F', label: 'Réglages' },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-tab ${view === tab.id ? 'nav-active' : ''}`}
          onClick={() => onChangeView(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
