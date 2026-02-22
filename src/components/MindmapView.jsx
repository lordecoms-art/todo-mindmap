import { useState, useRef, useCallback, useEffect } from 'react';
import { STATUS_COLORS } from '../utils/constants';

/**
 * Vue mindmap — visualisation pure, lecture seule.
 * Tap projet = expand/collapse. Pinch zoom + pan. Double tap = recenter.
 */
export default function MindmapView({ projects }) {
  const containerRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const pinchStart = useRef(null);
  const lastTap = useRef(0);
  const [expanded, setExpanded] = useState({});

  // ─── Adaptive layout sizing ──────────────────────────────────
  const n = projects.length;
  const projectRadius = n <= 2 ? 170 : n <= 4 ? 200 : Math.max(180, n * 42);
  const taskRadius = n <= 3 ? 130 : 120;
  // Scale down nodes if many projects
  const nodeScale = n >= 6 ? 0.85 : n >= 5 ? 0.92 : 1;

  // ─── Position calculations ───────────────────────────────────
  const getProjectPos = useCallback((index, total) => {
    if (total === 1) return { x: 0, y: -projectRadius * 0.6 };
    const angle = (2 * Math.PI * index) / total - Math.PI / 2;
    return { x: projectRadius * Math.cos(angle), y: projectRadius * Math.sin(angle) };
  }, [projectRadius]);

  const getTaskPos = useCallback((projPos, taskIndex, totalTasks, projIndex, totalProjects) => {
    // Tasks fan out on the EXTERIOR side (away from center)
    const projAngle = totalProjects === 1
      ? -Math.PI / 2
      : (2 * Math.PI * projIndex) / totalProjects - Math.PI / 2;
    const spread = Math.min(0.6, 0.35 + totalTasks * 0.06);
    const startAngle = projAngle - (spread * (totalTasks - 1)) / 2;
    const angle = startAngle + spread * taskIndex;
    return {
      x: projPos.x + taskRadius * Math.cos(angle),
      y: projPos.y + taskRadius * Math.sin(angle),
    };
  }, [taskRadius]);

  // ─── Fit to view ─────────────────────────────────────────────
  const fitToView = useCallback(() => {
    const container = containerRef.current;
    if (!container || projects.length === 0) {
      setTransform({ x: 0, y: 0, scale: 1 });
      return;
    }
    let minX = -50, maxX = 50, minY = -50, maxY = 50;
    projects.forEach((proj, pi) => {
      const pp = getProjectPos(pi, projects.length);
      minX = Math.min(minX, pp.x - 90 * nodeScale);
      maxX = Math.max(maxX, pp.x + 90 * nodeScale);
      minY = Math.min(minY, pp.y - 45 * nodeScale);
      maxY = Math.max(maxY, pp.y + 45 * nodeScale);
      if (expanded[proj.id]) {
        proj.tasks.forEach((task, ti) => {
          const tp = getTaskPos(pp, ti, proj.tasks.length, pi, projects.length);
          const textW = Math.max(55, task.text.length * 4);
          minX = Math.min(minX, tp.x - textW);
          maxX = Math.max(maxX, tp.x + textW);
          minY = Math.min(minY, tp.y - 22);
          maxY = Math.max(maxY, tp.y + 22);
        });
      }
    });
    const cw = maxX - minX + 30, ch = maxY - minY + 30;
    const s = Math.min(container.clientWidth / cw, container.clientHeight / ch, 1.4);
    setTransform({ x: 0, y: 0, scale: Math.max(s, 0.2) });
  }, [projects, expanded, getProjectPos, getTaskPos, nodeScale]);

  useEffect(() => {
    const frame = requestAnimationFrame(fitToView);
    return () => cancelAnimationFrame(frame);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refit when expand changes
  useEffect(() => {
    const t = setTimeout(fitToView, 50);
    return () => clearTimeout(t);
  }, [expanded, fitToView]);

  // ─── Wheel zoom ──────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setTransform(prev => ({ ...prev, scale: Math.max(0.15, Math.min(5, prev.scale * delta)) }));
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // ─── Mouse pan ───────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.mm-proj')) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX - transform.x, y: e.clientY - transform.y };
  }, [transform]);

  const handleMouseMove = useCallback((e) => {
    if (!isPanning) return;
    setTransform(prev => ({ ...prev, x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y }));
  }, [isPanning]);

  const handleMouseUp = useCallback(() => { setIsPanning(false); }, []);

  // ─── Touch: pan + pinch + double-tap ─────────────────────────
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      pinchStart.current = { dist: Math.sqrt(dx * dx + dy * dy), scale: transform.scale };
      return;
    }
    if (e.target.closest('.mm-proj')) return;
    if (e.touches.length === 1) {
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
      setTransform(prev => ({ ...prev, scale: Math.max(0.15, Math.min(5, newScale)) }));
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

  // ─── Toggle expand ───────────────────────────────────────────
  const toggleExpand = useCallback((projId) => {
    setExpanded(prev => ({ ...prev, [projId]: !prev[projId] }));
  }, []);

  // ─── Bézier helpers ──────────────────────────────────────────
  const bezier = (x1, y1, x2, y2) => {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const dx = x2 - x1, dy = y2 - y1;
    const cx1 = mx - dy * 0.15, cy1 = my + dx * 0.15;
    return `M${x1},${y1} Q${cx1},${cy1} ${x2},${y2}`;
  };

  // ─── Build SVG ───────────────────────────────────────────────
  const lines = [];
  const taskElements = [];
  const projElements = [];

  // Central node
  const centralNode = (
    <g key="central">
      <circle cx={0} cy={0} r={45} fill="url(#centralFill)" stroke="url(#centralStroke)" strokeWidth={2.5}>
        <animate attributeName="r" values="44;46;44" dur="4s" repeatCount="indefinite" />
      </circle>
      <text x={0} y={-7} textAnchor="middle" fill="#fff"
        style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700 }}>ToDo</text>
      <text x={0} y={11} textAnchor="middle" fill="rgba(255,255,255,0.6)"
        style={{ fontFamily: "'Space Mono', monospace", fontSize: 10 }}>Mindmap</text>
    </g>
  );

  projects.forEach((proj, pi) => {
    const pp = getProjectPos(pi, projects.length);
    const isExp = expanded[proj.id];
    const doneTasks = proj.tasks.filter(t => t.status === 'done').length;
    const progress = proj.tasks.length ? doneTasks / proj.tasks.length : 0;

    // Line: center -> project
    lines.push(
      <path key={`lc-${proj.id}`} d={bezier(0, 0, pp.x, pp.y)}
        fill="none" stroke={proj.color} strokeWidth={2} opacity={0.5} />
    );

    // Measure node width based on name length
    const nameLen = proj.name.length;
    const pw = Math.max(150, nameLen * 9 + 50) * nodeScale;
    const ph = 70 * nodeScale;

    projElements.push(
      <g key={`p-${proj.id}`} className="mm-proj" style={{ cursor: 'pointer' }}
         onClick={() => toggleExpand(proj.id)}>
        {/* Background */}
        <rect x={pp.x - pw / 2} y={pp.y - ph / 2} width={pw} height={ph} rx={16 * nodeScale}
          fill={proj.color + '18'} stroke={proj.color} strokeWidth={1.8}
          style={{ filter: `drop-shadow(0 0 14px ${proj.color}22)` }} />
        {/* Emoji */}
        <text x={pp.x - pw / 2 + 24 * nodeScale} y={pp.y + 2} textAnchor="middle"
          fontSize={24 * nodeScale}>{proj.emoji}</text>
        {/* Name — never truncated */}
        <text x={pp.x + 6 * nodeScale} y={pp.y - 8 * nodeScale} textAnchor="middle" fill="#fff"
          style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14 * nodeScale, fontWeight: 600 }}>
          {proj.name}
        </text>
        {/* Mini progress bar */}
        <rect x={pp.x - 30 * nodeScale} y={pp.y + 10 * nodeScale}
          width={60 * nodeScale} height={4 * nodeScale} rx={2} fill="#333" />
        <rect x={pp.x - 30 * nodeScale} y={pp.y + 10 * nodeScale}
          width={60 * nodeScale * progress} height={4 * nodeScale} rx={2} fill={proj.color} />
        {/* Count */}
        <text x={pp.x + 6 * nodeScale} y={pp.y + 26 * nodeScale} textAnchor="middle" fill="#777"
          style={{ fontFamily: "'Space Mono', monospace", fontSize: 9 * nodeScale }}>
          {doneTasks}/{proj.tasks.length}
        </text>
        {/* Expand indicator */}
        <text x={pp.x + pw / 2 - 14 * nodeScale} y={pp.y + 4} textAnchor="middle"
          fill="#666" fontSize={9 * nodeScale}>
          {isExp ? '▲' : '▼'}
        </text>
      </g>
    );

    // Tasks (expanded only)
    if (isExp) {
      proj.tasks.forEach((task, ti) => {
        const tp = getTaskPos(pp, ti, proj.tasks.length, pi, projects.length);
        const isDone = task.status === 'done';
        const statusColor = STATUS_COLORS[task.status];
        const textLen = task.text.length;
        const tw = Math.max(110, textLen * 7 + 36) * nodeScale;
        const th = 38 * nodeScale;

        // Line: project -> task
        lines.push(
          <path key={`lt-${proj.id}-${task.id}`} d={bezier(pp.x, pp.y, tp.x, tp.y)}
            fill="none" stroke={proj.color} strokeWidth={1.5} opacity={isDone ? 0.2 : 0.4} />
        );

        taskElements.push(
          <g key={`t-${proj.id}-${task.id}`} opacity={isDone ? 0.45 : 1}
            style={{ animation: 'mmTaskIn 0.3s ease' }}>
            {/* Pill background */}
            <rect x={tp.x - tw / 2} y={tp.y - th / 2} width={tw} height={th}
              rx={th / 2} fill={isDone ? '#0d0d18' : '#12121c'}
              stroke={isDone ? statusColor + '44' : proj.color + '55'} strokeWidth={1.2} />
            {/* Status dot */}
            <circle cx={tp.x - tw / 2 + 16 * nodeScale} cy={tp.y} r={4.5 * nodeScale} fill={statusColor} />
            {/* Text — never truncated */}
            <text x={tp.x + 6 * nodeScale} y={tp.y + 4 * nodeScale} textAnchor="middle"
              fill={isDone ? '#666' : '#ccc'}
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11.5 * nodeScale,
                textDecoration: isDone ? 'line-through' : 'none',
              }}>
              {task.text}
            </text>
          </g>
        );
      });
    }
  });

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

      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <radialGradient id="centralFill" cx="40%" cy="40%">
            <stop offset="0%" stopColor="#2a1f4e" />
            <stop offset="100%" stopColor="#151525" />
          </radialGradient>
          <linearGradient id="centralStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ECDC4" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        <g transform={`translate(${transform.x + cWidth / 2}, ${transform.y + cHeight / 2}) scale(${transform.scale})`}>
          {lines}
          {taskElements}
          {projElements}
          {centralNode}
        </g>
      </svg>

      <style>{`
        @keyframes mmTaskIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
