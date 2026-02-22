import { useState } from 'react';

const SLIDES = [
  {
    icon: '\u{1F9E0}',
    title: 'Bienvenue !',
    text: 'ToDo Mindmap combine une todolist et une mindmap visuelle pour organiser vos projets.',
  },
  {
    icon: '\u{1F5FA}\uFE0F',
    title: 'Vue Mindmap',
    text: 'Visualisez vos projets et tâches en arbre interactif. Zoomez, glissez, réorganisez.',
  },
  {
    icon: '\u{1F4CB}',
    title: 'Vue Liste',
    text: 'Gérez vos tâches en cartes. Swipez pour changer le statut, glissez pour réordonner.',
  },
];

/**
 * Onboarding au premier lancement (3 slides)
 * @param {{ onComplete: () => void }} props
 */
export default function Onboarding({ onComplete }) {
  const [current, setCurrent] = useState(0);
  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-icon">{slide.icon}</div>
        <h2 className="onboarding-title">{slide.title}</h2>
        <p className="onboarding-text">{slide.text}</p>

        <div className="onboarding-dots">
          {SLIDES.map((_, i) => (
            <div key={i} className={`onboarding-dot ${i === current ? 'dot-active' : ''}`} />
          ))}
        </div>

        <div className="onboarding-actions">
          {!isLast ? (
            <>
              <button className="btn btn-secondary" onClick={onComplete}>Passer</button>
              <button className="btn btn-gradient" onClick={() => setCurrent(c => c + 1)}>Suivant</button>
            </>
          ) : (
            <button className="btn btn-gradient btn-full" onClick={onComplete}>Commencer</button>
          )}
        </div>
      </div>
    </div>
  );
}
