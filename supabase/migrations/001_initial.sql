-- 채팅 세션 테이블
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  sources JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱싱 로그 테이블
CREATE TABLE IF NOT EXISTS indexing_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  document_count INTEGER NOT NULL,
  indexed_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE indexing_logs ENABLE ROW LEVEL SECURITY;

-- 인증 없이 모든 사용자(anon 포함) 전체 허용
CREATE POLICY "public_all_sessions"
  ON chat_sessions FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "public_all_messages"
  ON chat_messages FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "public_all_indexing_logs"
  ON indexing_logs FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 조회 성능 향상을 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
