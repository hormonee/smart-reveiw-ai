"use client";

import { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type View = "welcome" | "active";

interface Source {
  rank: number;
  id: string;
  rating: number;
  title: string;
  author: string;
  date: string;
  helpful_votes: number;
  verified_purchase: boolean;
  content: string;
  relevance: number;
}

interface Summary {
  avgRating: number;
  totalReviews: number;
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
  pros: string[];
  cons: string[];
  tags: string[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  summary?: Summary;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconPlus() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>;
}
function IconProduct() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
}
function IconHistory() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.5" /></svg>;
}
function IconChevronDown() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>;
}
function IconChevronUp() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>;
}
function IconSettings() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;
}
function IconShare() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>;
}
function IconStar({ filled = false }: { filled?: boolean }) {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "#f59e0b" : "none"} stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
}
function IconPaperclip() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" /></svg>;
}
function IconMic() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>;
}
function IconImage() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>;
}
function IconSend() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
}
function IconMoreVert() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1" fill="currentColor" /><circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="12" cy="19" r="1" fill="currentColor" /></svg>;
}
function IconBookmark() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>;
}
function IconFileText() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>;
}
function IconThumbUp() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" /><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>;
}
function IconThumbDown() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" /><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" /></svg>;
}
function IconBot() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M12 11V3" /><circle cx="12" cy="3" r="1" /><line x1="8" y1="16" x2="8" y2="16" strokeWidth="3" /><line x1="16" y1="16" x2="16" y2="16" strokeWidth="3" /><path d="M3 16h2M21 16h-2" /></svg>;
}
function IconShoppingBag() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>;
}
function IconDatabase() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" /><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" /></svg>;
}
function IconCheck() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}
function IconExercise() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 6.5l11 11" /><path d="M21 3L15 9" /><path d="M3 21l6-6" /><path d="M15 9l2.5-2.5" /><path d="M6.5 6.5L9 9" /><circle cx="18" cy="6" r="2" /><circle cx="6" cy="18" r="2" /></svg>;
}
function IconBattery() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="18" height="12" rx="2" ry="2" /><line x1="23" y1="13" x2="23" y2="11" /><path d="M6 10h6" /></svg>;
}
function IconCall() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.05z" /><path d="M16 2s4 4 4 8" /><path d="M19 5s1 1 1 3" /></svg>;
}
function IconLoader() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ animation: "spin 1s linear infinite" }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

// ─── Analysis Card ─────────────────────────────────────────────────────────────

function AnalysisCard({ summary, sources }: { summary: Summary; sources: Source[] }) {
  const [sourcesOpen, setSourcesOpen] = useState(true);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Summary card */}
      <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: "0 0 4px" }}>분석 요약</h3>
              <p style={{ fontSize: 13, color: "#9ca3af", margin: 0 }}>{summary.totalReviews}개의 관련 리뷰 기반</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 32, fontWeight: 800, color: "#111827" }}>{summary.avgRating}</span>
                <IconStar filled />
              </div>
              <div style={{ fontSize: 11, color: "#9ca3af", letterSpacing: "0.05em", fontWeight: 600 }}>평균 평점</div>
            </div>
          </div>

          {/* Sentiment bar */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: "0.05em" }}>감성 분포</span>
              <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>{summary.positivePercent}% 긍정적</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: "#f3f4f6", overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${summary.positivePercent}%`, background: "#22c55e", borderRadius: summary.neutralPercent === 0 && summary.negativePercent === 0 ? "4px" : "4px 0 0 4px" }} />
              {summary.neutralPercent > 0 && <div style={{ width: `${summary.neutralPercent}%`, background: "#d1d5db" }} />}
              {summary.negativePercent > 0 && <div style={{ width: `${summary.negativePercent}%`, background: "#ef4444", borderRadius: "0 4px 4px 0" }} />}
            </div>
          </div>

          {/* Pros/Cons */}
          <div style={{ display: "flex", gap: 14 }}>
            <div style={{ flex: 1, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <IconThumbUp />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>장점</span>
              </div>
              {summary.pros.map((p, i) => (
                <div key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 4, paddingLeft: 4 }}>• {p}</div>
              ))}
            </div>
            <div style={{ flex: 1, background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <IconThumbDown />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#b91c1c" }}>단점</span>
              </div>
              {summary.cons.map((c, i) => (
                <div key={i} style={{ fontSize: 13, color: "#374151", marginBottom: 4, paddingLeft: 4 }}>• {c}</div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Sources */}
      {sources.length > 0 && (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 16, background: "#fff", boxShadow: "0 1px 6px rgba(0,0,0,0.06)", overflow: "hidden" }}>
          <button onClick={() => setSourcesOpen(o => !o)} style={{ width: "100%", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "none", background: "transparent", cursor: "pointer" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <IconFileText />
              <span style={{ fontSize: 15, fontWeight: 600, color: "#111827" }}>참고 리뷰 ({sources.length}개 검토)</span>
            </div>
            {sourcesOpen ? <IconChevronUp /> : <IconChevronDown />}
          </button>
          {sourcesOpen && (
            <div style={{ borderTop: "1px solid #f3f4f6" }}>
              {sources.map((src, i) => (
                <div key={i} style={{ padding: "16px 20px", borderBottom: i < sources.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ display: "flex", gap: 2 }}>
                        {[1, 2, 3, 4, 5].map(s => <IconStar key={s} filled={s <= src.rating} />)}
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{src.author}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#111827", marginBottom: 4 }}>{src.title}</div>
                  <p style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.6, margin: 0 }}>"{src.content}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Active Chat ──────────────────────────────────────────────────────────────

function ActiveChatPage({
  messages,
  onSend,
  isLoading,
}: {
  messages: ChatMessage[];
  onSend: (msg: string) => void;
  isLoading: boolean;
}) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function handleSend() {
    const msg = input.trim();
    if (!msg || isLoading) return;
    onSend(msg);
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", width: "100%" }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 24, animation: "fadeIn 0.3s ease" }}>
              {msg.role === "user" ? (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={{ maxWidth: 640, padding: "14px 18px", borderRadius: "18px 18px 4px 18px", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontSize: 15, lineHeight: 1.6, boxShadow: "0 2px 8px rgba(37,99,235,0.25)" }}>
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg, #3b82f6, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(59,130,246,0.3)" }}>
                    <IconBot />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ padding: "14px 18px", borderRadius: "4px 18px 18px 18px", border: "1px solid #e5e7eb", background: "#fff", fontSize: 15, lineHeight: 1.7, color: "#374151", marginBottom: msg.summary ? 16 : 0, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                      {msg.content}
                    </div>
                    {msg.summary && msg.sources && (
                      <AnalysisCard summary={msg.summary} sources={msg.sources} />
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: "linear-gradient(135deg, #3b82f6, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <IconBot />
              </div>
              <div style={{ padding: "14px 18px", borderRadius: "4px 18px 18px 18px", border: "1px solid #e5e7eb", background: "#fff", display: "flex", alignItems: "center", gap: 10, color: "#9ca3af", fontSize: 14 }}>
                <IconLoader /> 리뷰를 분석하는 중...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ borderTop: "1px solid #f3f4f6", paddingBottom: 12 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", width: "100%", padding: "12px 20px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff", padding: "10px 14px 10px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="특정 기능, 가격 대비 성능, 또는 비교 제품에 대해 물어보세요..."
              rows={1}
              disabled={isLoading}
              style={{ flex: 1, border: "none", outline: "none", fontSize: 15, color: "#374151", resize: "none", fontFamily: "inherit", background: "transparent", lineHeight: 1.5 }}
            />
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              ><IconPaperclip /></button>
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                style={{ width: 36, height: 36, borderRadius: 10, border: "none", background: isLoading || !input.trim() ? "#e5e7eb" : "linear-gradient(135deg, #3b82f6, #2563eb)", cursor: isLoading || !input.trim() ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: isLoading ? "none" : "0 2px 6px rgba(37,99,235,0.3)", transition: "all 0.15s" }}
              >
                {isLoading ? <IconLoader /> : <IconSend />}
              </button>
            </div>
          </div>
          <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
            AI가 요약된 데이터를 제공할 수 있습니다. 구매 전 주요 사항을 직접 확인하세요.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Welcome Page ─────────────────────────────────────────────────────────────

function WelcomePage({ onSubmit }: { onSubmit: (msg: string) => void }) {
  const [input, setInput] = useState("");

  const suggestions = [
    { icon: <IconExercise />, title: "운동 시 사용", desc: "\"고강도 운동 시에도 사용할 수 있나요?\"" },
    { icon: <IconBattery />, title: "배터리 수명", desc: "\"배터리가 광고대로 지속되나요?\"" },
    { icon: <IconCall />, title: "통화 품질", desc: "\"소음이 있는 환경에서 마이크 품질은?\"" },
  ];

  function handleSend() {
    const msg = input.trim();
    if (!msg) return;
    onSubmit(msg);
    setInput("");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", height: "100%", padding: "48px 24px 16px" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24, textAlign: "center", maxWidth: 640, width: "100%" }}>
        <div style={{ width: 200, height: 200, borderRadius: 24, overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.1)", marginBottom: 8 }}>
          <img src="/images/premium-wireless-earbud-pro.png" alt="Premium Wireless Earbud Pro" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: "#111827", letterSpacing: "-0.5px", marginBottom: 12, margin: "0 0 12px" }}>반갑습니다. 무엇을 도와드릴까요?</h1>
          <p style={{ fontSize: 15, color: "#6b7280", lineHeight: 1.6, maxWidth: 480, margin: 0 }}>Premium Wireless Earbud Pro에 대해 기술 사양부터 실제 사용자 경험까지 무엇이든 물어보세요!</p>
        </div>
        <div style={{ display: "flex", gap: 16, width: "100%", marginTop: 8 }}>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => onSubmit(s.desc.replace(/"/g, ""))} style={{ flex: 1, textAlign: "left", padding: "16px 18px", border: "1px solid #e5e7eb", borderRadius: 12, background: "#fff", cursor: "pointer", transition: "all 0.15s" }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#93c5fd"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 12px rgba(59,130,246,0.1)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}
            >
              <div style={{ marginBottom: 10 }}>{s.icon}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", maxWidth: 720 }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff", padding: "12px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Premium Wireless Earbud Pro에 대해 물어보세요..."
            rows={1}
            style={{ width: "100%", border: "none", outline: "none", fontSize: 15, color: "#374151", resize: "none", fontFamily: "inherit", background: "transparent", lineHeight: 1.5 }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[<IconPaperclip key="p" />, <IconMic key="m" />, <IconImage key="i" />].map((icon, i) => (
                <button key={i} style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >{icon}</button>
              ))}
            </div>
            <button onClick={handleSend} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 18px", borderRadius: 9, background: input.trim() ? "linear-gradient(135deg,#3b82f6,#2563eb)" : "#e5e7eb", color: input.trim() ? "#fff" : "#9ca3af", border: "none", cursor: input.trim() ? "pointer" : "default", fontSize: 14, fontWeight: 600, transition: "all 0.15s" }}>
              전송 <IconSend />
            </button>
          </div>
        </div>
        <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 8 }}>AI가 부정확한 정보를 제공할 수 있습니다. 중요한 내용은 직접 확인하세요.</p>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function Sidebar({
  view,
  onNewChat,
  onIndex,
  indexStatus,
  recentChats,
  savedItems,
}: {
  view: View;
  onNewChat: () => void;
  onIndex: () => void;
  indexStatus: "idle" | "loading" | "done" | "error";
  recentChats: string[];
  savedItems: string[];
}) {
  const isActive = view === "active";

  const indexBtnLabel =
    indexStatus === "loading" ? "인덱싱 중..." :
      indexStatus === "done" ? "인덱싱 완료 ✓" :
        indexStatus === "error" ? "다시 시도" :
          "샘플 데이터 인덱싱";

  const indexBtnBg =
    indexStatus === "done" ? "#16a34a" :
      indexStatus === "error" ? "#dc2626" :
        "#f3f4f6";

  const indexBtnColor =
    indexStatus === "done" || indexStatus === "error" ? "#fff" : "#374151";

  return (
    <aside style={{ width: 264, borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", background: "#fff", flexShrink: 0 }}>
      <div style={{ padding: "16px 16px 12px" }}>
        <button onClick={onNewChat} style={{ width: "100%", padding: "10px 16px", background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 2px 8px rgba(37,99,235,0.3)", transition: "all 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 14px rgba(37,99,235,0.4)")}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 8px rgba(37,99,235,0.3)")}
        >
          <IconPlus /> 새 분석
        </button>
      </div>

      <nav style={{ flex: 1, padding: "0 8px", overflowY: "auto" }}>
        <div style={{ padding: "12px 12px 8px", display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          <IconFileText /> 최근 채팅
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {recentChats.map((chat, i) => (
            <ChatItem key={i} label={chat.length > 200 ? chat.slice(0, 200) + "..." : chat} active={isActive && i === 0} />
          ))}
        </div>

        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f3f4f6" }}>
          <div style={{ padding: "0 12px 8px", display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            <IconBookmark /> 저장된 항목
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {savedItems.map((item, i) => (
              <SavedItem key={i} label={item} />
            ))}
          </div>
        </div>
      </nav>

      {/* 인덱싱 버튼 */}
      <div style={{ padding: "8px 16px 12px", borderTop: "1px solid #f3f4f6" }}>
        <button
          onClick={onIndex}
          disabled={indexStatus === "loading" || indexStatus === "done"}
          style={{ width: "100%", padding: "9px 14px", borderRadius: 9, border: `1px solid ${indexStatus === "done" ? "#bbf7d0" : indexStatus === "error" ? "#fecdd3" : "#e5e7eb"}`, background: indexBtnBg, color: indexBtnColor, fontSize: 13, fontWeight: 500, cursor: indexStatus === "loading" || indexStatus === "done" ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}
          onMouseEnter={e => { if (indexStatus === "idle" || indexStatus === "error") (e.currentTarget as HTMLButtonElement).style.background = "#e9ecef"; }}
          onMouseLeave={e => { if (indexStatus === "idle") (e.currentTarget as HTMLButtonElement).style.background = "#f3f4f6"; }}
        >
          {indexStatus === "loading" ? <IconLoader /> : indexStatus === "done" ? <IconCheck /> : <IconDatabase />}
          {indexBtnLabel}
        </button>
      </div>

      {/* User info */}
      <div style={{ padding: "14px 16px", borderTop: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#60a5fa,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{isActive ? "A" : "U"}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{isActive ? "최프로" : "김무료"}</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>{isActive ? "Pro Tier" : "Free Tier"}</div>
        </div>
        {isActive && <button style={{ background: "transparent", border: "none", cursor: "pointer", color: "#9ca3af" }}><IconMoreVert /></button>}
      </div>
    </aside>
  );
}

function NavItem({ icon, label, hasChevron }: { icon: React.ReactNode; label: string; hasChevron?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", color: "#374151" }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#f3f4f6")}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
    >
      <span style={{ color: "#6b7280" }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{label}</span>
      {hasChevron && <span style={{ color: "#9ca3af" }}><IconChevronDown /></span>}
    </div>
  );
}

function ChatItem({ label, active }: { label: string; active?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", background: active ? "#eff6ff" : "transparent" }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "#f3f4f6"; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={active ? "#2563eb" : "#9ca3af"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
      <span style={{ fontSize: 14, fontWeight: active ? 600 : 400, color: active ? "#2563eb" : "#374151" }}>{label}</span>
    </div>
  );
}

function SavedItem({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer" }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#f3f4f6")}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
    >
      <span style={{ color: "#9ca3af" }}><IconBookmark /></span>
      <span style={{ fontSize: 14, color: "#374151" }}>{label}</span>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({ view }: { view: View }) {
  const isActive = view === "active";
  return (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", height: 60, borderBottom: "1px solid #e5e7eb", background: "#fff", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#3b82f6,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px rgba(37,99,235,0.3)" }}>
          <IconShoppingBag />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#111827" }}>Premium Wireless Earbud Pro</div>
          <div style={{ fontSize: 12, color: "#9ca3af" }}>{isActive ? "AI 제품 리뷰 어시스턴트" : "리뷰 어시스턴트"}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {isActive && (
          <button style={{ width: 36, height: 36, borderRadius: 9, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")} onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
          ><IconShare /></button>
        )}
        <button style={{ width: 36, height: 36, borderRadius: 9, border: "1px solid #e5e7eb", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}
          onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")} onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
        ><IconSettings /></button>
      </div>
    </header>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function Home() {
  const [view, setView] = useState<View>("welcome");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [indexStatus, setIndexStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [recentChats, setRecentChats] = useState<string[]>([]);
  const [savedItems, setSavedItems] = useState<string[]>([]);

  async function handleSubmit(query: string) {
    setView("active");
    setIsLoading(true);

    // 첫 질문일 경우 사이드바 업데이트
    if (messages.length === 0) {
      setRecentChats(prev => [query, ...prev]);
      setSavedItems(prev => ["Premium Wireless Earbud Pro", ...prev]);
    }

    setMessages(prev => [...prev, { role: "user", content: query }]);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, sessionId }),
      });
      const data = await res.json();

      if (data.sessionId) setSessionId(data.sessionId);

      if (data.success) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
          summary: data.summary,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: `오류가 발생했습니다: ${data.error}`,
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "서버 연결에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleIndex() {
    setIndexStatus("loading");
    try {
      const res = await fetch("/api/index", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setIndexStatus("done");
      } else {
        console.error("Indexing error:", data.error);
        setIndexStatus("error");
      }
    } catch (e) {
      console.error("Indexing fetch error:", e);
      setIndexStatus("error");
    }
  }

  function handleNewChat() {
    setView("welcome");
    setMessages([]);
    setSessionId(undefined);
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", background: "#fff" }}>
      <Sidebar
        view={view}
        onNewChat={handleNewChat}
        onIndex={handleIndex}
        indexStatus={indexStatus}
        recentChats={recentChats}
        savedItems={savedItems}
      />
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <Header view={view} />
        <div style={{ flex: 1, overflow: "hidden" }}>
          {view === "welcome" ? (
            <WelcomePage onSubmit={handleSubmit} />
          ) : (
            <ActiveChatPage messages={messages} onSend={handleSubmit} isLoading={isLoading} />
          )}
        </div>
      </main>
    </div>
  );
}
