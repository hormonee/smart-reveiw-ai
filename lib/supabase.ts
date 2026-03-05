import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
if (!supabaseKey) throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY is not set");

// 싱글톤 Supabase 클라이언트 (서버 & 클라이언트 공용, 인증 없음)
export const supabase = createClient(supabaseUrl, supabaseKey);

// 채팅 세션 생성
export async function createChatSession(title: string) {
    const { data, error } = await supabase
        .from("chat_sessions")
        .insert({ title })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// 메시지 저장
export async function saveChatMessage(
    sessionId: string,
    role: "user" | "assistant",
    content: string,
    sources?: object[]
) {
    const { data, error } = await supabase
        .from("chat_messages")
        .insert({ session_id: sessionId, role, content, sources })
        .select()
        .single();

    if (error) throw error;
    return data;
}

// 세션의 메시지 조회
export async function getChatMessages(sessionId: string) {
    const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

    if (error) throw error;
    return data;
}

// 인덱싱 완료 기록
export async function logIndexing(source: string, count: number) {
    const { data, error } = await supabase
        .from("indexing_logs")
        .insert({ source, document_count: count })
        .select()
        .single();

    if (error) throw error;
    return data;
}
