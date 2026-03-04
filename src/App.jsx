import { useState, useEffect, useCallback } from "react";

const TOPICS = [
  { id: "politics", label: "Politics & Current Events", icon: "🏛️", query: "politics current events government policy" },
  { id: "technology", label: "Technology & AI", icon: "🤖", query: "technology artificial intelligence science innovation" },
  { id: "science", label: "Science & History", icon: "🔭", query: "science discovery history research" },
  { id: "iran", label: "US–Iran War", icon: "⚡", query: "US Iran war 2026 military strikes Operation Epic Fury Operation Roaring Lion Middle East conflict" },
];

const SYSTEM_PROMPT = `You are a neutral, factual news summarizer. 
Given a news topic, generate 5 recent, realistic news stories.

Rules:
- Use plain, direct language only
- No sensationalist or alarming headlines
- No opinion or editorial content
- No repetitive stories (each must be distinctly different)
- Each summary must be exactly 2-3 sentences: factual, clear, calm
- Headlines must be under 12 words, descriptive but not dramatic

Respond ONLY with a JSON array, no markdown, no preamble. Format:
[
  { "headline": "...", "summary": "...", "source": "Reuters" },
  ...
]

Use realistic but varied source names like: Reuters, BBC News, AP News, NPR, The Guardian, Nature, Science Daily, MIT Technology Review, Politico, C-SPAN News.`;

function timeAgo(date) {
  const mins = Math.floor((Date.now() - date) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="sk-line sk-title" />
      <div className="sk-line sk-body" />
      <div className="sk-line sk-body short" />
      <div className="sk-line sk-meta" />
    </div>
  );
}

export default function NewsDashboard() {
  const [activeTopic, setActiveTopic] = useState(TOPICS[0]);
  const [stories, setStories] = useState({});
  const [loading, setLoading] = useState(false);
  const [lastFetched, setLastFetched] = useState({});
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const fetchStories = useCallback(async (topic, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.REACT_APP_ANTHROPIC_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-5-20251001",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `Generate 5 current news stories about: ${topic.query}` }],
        }),
      });

      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "[]";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      const timestamped = parsed.map(s => ({ ...s, fetchedAt: Date.now() }));
      setStories(prev => ({ ...prev, [topic.id]: timestamped }));
      setLastFetched(prev => ({ ...prev, [topic.id]: Date.now() }));

      if (silent) {
        setNotification(`${topic.icon} New ${topic.label} stories loaded`);
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (e) {
      setError("Could not load stories. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load for active topic
  useEffect(() => {
    if (!stories[activeTopic.id]) {
      fetchStories(activeTopic);
    }
  }, [activeTopic, stories, fetchStories]);

  // Background refresh every 3 hours for all topics
  useEffect(() => {
    const interval = setInterval(() => {
      TOPICS.forEach(topic => fetchStories(topic, true));
    }, 3 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchStories]);

  const currentStories = stories[activeTopic.id] || [];
  const lastTime = lastFetched[activeTopic.id];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Source+Sans+3:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #0f0f0f; }

        .app {
          min-height: 100vh;
          background: #0f0f0f;
          color: #e8e2d9;
          font-family: 'Source Sans 3', sans-serif;
          font-weight: 300;
        }

        .header {
          border-bottom: 1px solid #2a2a2a;
          padding: 28px 40px 0;
          position: sticky;
          top: 0;
          background: #0f0f0f;
          z-index: 10;
        }

        .header-top {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .brand {
          font-family: 'Playfair Display', serif;
          font-size: 22px;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: #e8e2d9;
        }

        .brand span {
          color: #c9a84c;
        }

        .last-updated {
          font-size: 12px;
          color: #555;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .tabs {
          display: flex;
          gap: 0;
        }

        .tab {
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: #555;
          cursor: pointer;
          font-family: 'Source Sans 3', sans-serif;
          font-size: 13px;
          font-weight: 400;
          letter-spacing: 0.08em;
          padding: 12px 20px;
          text-transform: uppercase;
          transition: color 0.2s, border-color 0.2s;
        }

        .tab:hover { color: #999; }

        .tab.active {
          color: #c9a84c;
          border-bottom-color: #c9a84c;
        }

        .main {
          max-width: 780px;
          margin: 0 auto;
          padding: 40px 40px 80px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .section-title {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          font-weight: 400;
          color: #e8e2d9;
        }

        .refresh-btn {
          background: none;
          border: 1px solid #2a2a2a;
          border-radius: 4px;
          color: #555;
          cursor: pointer;
          font-family: 'Source Sans 3', sans-serif;
          font-size: 12px;
          letter-spacing: 0.06em;
          padding: 8px 16px;
          text-transform: uppercase;
          transition: border-color 0.2s, color 0.2s;
        }

        .refresh-btn:hover:not(:disabled) {
          border-color: #c9a84c;
          color: #c9a84c;
        }

        .refresh-btn:disabled { opacity: 0.4; cursor: default; }

        .stories {
          display: flex;
          flex-direction: column;
          gap: 1px;
          background: #1a1a1a;
          border: 1px solid #1a1a1a;
          border-radius: 6px;
          overflow: hidden;
        }

        .story-card {
          background: #141414;
          padding: 28px 32px;
          transition: background 0.15s;
        }

        .story-card:hover { background: #171717; }

        .story-headline {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 600;
          line-height: 1.4;
          color: #e8e2d9;
          margin-bottom: 10px;
        }

        .story-summary {
          font-size: 14px;
          line-height: 1.7;
          color: #999;
          margin-bottom: 14px;
          font-weight: 300;
        }

        .story-meta {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .story-source {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #c9a84c;
        }

        .story-time {
          font-size: 11px;
          color: #444;
          letter-spacing: 0.04em;
        }

        .divider {
          width: 24px;
          height: 1px;
          background: #2a2a2a;
        }

        /* Skeleton */
        .skeleton-card {
          background: #141414;
          padding: 28px 32px;
        }

        .sk-line {
          background: linear-gradient(90deg, #1e1e1e 25%, #252525 50%, #1e1e1e 75%);
          background-size: 200% 100%;
          animation: shimmer 1.6s infinite;
          border-radius: 3px;
          margin-bottom: 10px;
        }

        .sk-title { height: 20px; width: 75%; }
        .sk-body { height: 13px; width: 100%; }
        .sk-body.short { width: 60%; }
        .sk-meta { height: 11px; width: 120px; margin-top: 14px; }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .error {
          text-align: center;
          padding: 60px 0;
          color: #555;
          font-size: 14px;
        }

        .error button {
          background: none;
          border: 1px solid #2a2a2a;
          border-radius: 4px;
          color: #c9a84c;
          cursor: pointer;
          font-size: 12px;
          letter-spacing: 0.06em;
          margin-top: 16px;
          padding: 8px 20px;
          text-transform: uppercase;
        }

        .notification {
          position: fixed;
          bottom: 32px;
          right: 32px;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-left: 3px solid #c9a84c;
          border-radius: 4px;
          color: #e8e2d9;
          font-size: 13px;
          padding: 14px 20px;
          animation: slideIn 0.3s ease;
          z-index: 100;
        }

        @keyframes slideIn {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .auto-note {
          font-size: 11px;
          color: #333;
          letter-spacing: 0.04em;
          margin-top: 32px;
          text-align: center;
        }
      `}</style>

      <div className="app">
        <header className="header">
          <div className="header-top">
            <div className="brand">Brief<span>ly</span></div>
            {lastTime && (
              <div className="last-updated">Updated {timeAgo(lastTime)}</div>
            )}
          </div>
          <nav className="tabs">
            {TOPICS.map(t => (
              <button
                key={t.id}
                className={`tab ${activeTopic.id === t.id ? "active" : ""}`}
                onClick={() => setActiveTopic(t)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>
        </header>

        <main className="main">
          <div className="section-header">
            <h1 className="section-title">{activeTopic.label}</h1>
            <button
              className="refresh-btn"
              onClick={() => fetchStories(activeTopic)}
              disabled={loading}
            >
              {loading ? "Loading…" : "↻ Refresh"}
            </button>
          </div>

          {error ? (
            <div className="error">
              <p>{error}</p>
              <button onClick={() => fetchStories(activeTopic)}>Try Again</button>
            </div>
          ) : loading ? (
            <div className="stories">
              {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : (
            <div className="stories">
              {currentStories.map((s, i) => (
                <article key={i} className="story-card">
                  <h2 className="story-headline">{s.headline}</h2>
                  <p className="story-summary">{s.summary}</p>
                  <div className="story-meta">
                    <span className="story-source">{s.source}</span>
                    <div className="divider" />
                    <span className="story-time">{timeAgo(s.fetchedAt)}</span>
                  </div>
                </article>
              ))}
            </div>
          )}

          <p className="auto-note">Stories refresh automatically every 3 hours · Plain language · No opinion content</p>
        </main>
      </div>

      {notification && <div className="notification">{notification}</div>}
    </>
  );
}