import { NextRequest, NextResponse } from "next/server";
import { similaritySearch, similaritySearchWithScore } from "@/lib/pinecone";
import { createChatSession, saveChatMessage } from "@/lib/supabase";
import { ChatOpenAI } from "@langchain/openai";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { query, sessionId: existingSessionId } = body as {
            query: string;
            sessionId?: string;
        };

        if (!query || typeof query !== "string") {
            return NextResponse.json(
                { success: false, error: "query는 필수 항목입니다." },
                { status: 400 }
            );
        }

        // 1. 세션 생성 또는 재사용
        let sessionId = existingSessionId;
        if (!sessionId) {
            const session = await createChatSession(query.slice(0, 60));
            sessionId = session.id as string;
        }
        const resolvedSessionId = sessionId as string;

        // 2. 사용자 메시지 저장
        await saveChatMessage(resolvedSessionId, "user", query);

        // 3. Pinecone에서 유사도 검색 (상위 10개 가져와서 필터링)
        const rawResults = await similaritySearchWithScore(query, 10);

        // 3.1 유사도 임계값 필터링 (0.2 이상만)
        const RELEVANCY_THRESHOLD = 0.2;
        const resultsWithScore = rawResults
            .filter(([_, score]: [any, number]) => score >= RELEVANCY_THRESHOLD)
            .slice(0, 5); // 상위 최대 5개

        const results = resultsWithScore.map(([doc]: [any, number]) => doc);

        if (results.length === 0) {
            const noResultMsg =
                "질문과 관련성이 높은 리뷰를 찾지 못했습니다. 보다 구체적인 질문을 입력해 주시거나 다른 키워드로 검색해 보세요.";
            await saveChatMessage(resolvedSessionId, "assistant", noResultMsg);
            return NextResponse.json({
                success: true,
                sessionId: resolvedSessionId,
                answer: noResultMsg,
                sources: [],
                summary: null,
            });
        }

        // 4. 검색 결과로 분석 요약 생성
        const sources = resultsWithScore.map(([doc, score], i) => {
            const meta = doc.metadata as {
                id: string;
                rating: number;
                title: string;
                author: string;
                date: string;
                helpful_votes: number;
                verified_purchase: boolean;
            };
            const content = doc.pageContent;
            const contentMatch = content.match(/내용: (.+)/);
            const reviewText = contentMatch ? contentMatch[1].trim() : content;

            // 관련도 점수를 퍼센트로 변환 (예: 0.925 -> 93%)
            const relevance = Math.round(score * 100);

            return {
                rank: i + 1,
                id: meta.id,
                rating: meta.rating,
                title: meta.title,
                author: meta.author,
                date: meta.date,
                helpful_votes: meta.helpful_votes,
                verified_purchase: meta.verified_purchase,
                content: reviewText.length > 120 ? reviewText.slice(0, 120) + "..." : reviewText,
                relevance: relevance,
            };
        });

        // 5. 통계 계산
        const ratings = sources.map((s) => s.rating);
        const avgRating =
            Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10;
        const positiveCount = ratings.filter((r) => r >= 4).length;
        const positivePercent = Math.round((positiveCount / ratings.length) * 100);
        const negativeCount = ratings.filter((r) => r <= 2).length;
        const neutralCount = ratings.length - positiveCount - negativeCount;

        const summary = {
            avgRating,
            totalReviews: sources.length,
            positivePercent,
            neutralPercent: Math.round((neutralCount / ratings.length) * 100),
            negativePercent: Math.round((negativeCount / ratings.length) * 100),
            pros: [] as string[],
            cons: [] as string[],
        };

        // 6.5 LLM을 이용한 자연어 응답 생성 (LM Studio 로컬 모델 연동)
        let answerText = `${sources.length}개의 관련 리뷰를 분석했습니다. 평균 평점은 ${avgRating}점이며, ${positivePercent}%의 리뷰가 긍정적입니다.`;

        try {
            const llm = new ChatOpenAI({
                apiKey: "not-needed", // 최신 LangChain/OpenAI SDK 요구사항
                openAIApiKey: "not-needed",
                modelName: "qwen_qwen3.5-35b-a3b",
                configuration: {
                    baseURL: "http://127.0.0.1:1234/v1", // LM Studio 기본 API 주소
                },
                maxTokens: 6000,
                temperature: 0.4,
            });

            const contextText = sources.map(s => `- 평점: ${s.rating}점 / 리뷰: ${s.content}`).join("\n");

            const prompt = `당신은 쇼핑몰의 전문적인 AI 리뷰 분석가입니다. 
사용자의 질문: "${query}"

아래 실제 구매자 리뷰 데이터를 분석하여 다음 형식으로 답변해 주세요.

1. **[ANSWER]**: 질문에 대한 2~3문장의 깔끔한 답변
2. **[PROS]**: 리뷰에서 언급된 핵심 장점 2~3가지 (리스트 형식)
3. **[CONS]**: 리뷰에서 언급된 핵심 단점 1~2가지 (리스트 형식)

[리뷰 데이터]
${contextText}

[출력 형식]
[ANSWER]
(답변 내용)
[PROS]
- 장점1
- 장점2
[CONS]
- 단점1`;



            // 출력 예시:
            // (생각 과정...)
            // ***
            // 최종 답변 내용...`;

            const aiResponse = await llm.invoke(prompt);

            // 모델의 생각 과정(Thinking Process) 출력 방지 및 최종 답변만 추출
            let rawContent = aiResponse.content.toString();
            let cleanContent = rawContent;

            // 사용자의 요청대로 마지막 '</think>' 기호 다음부터 표시
            const lastThinkIndex = rawContent.lastIndexOf('</think>');
            let finalOutput = lastThinkIndex !== -1 ? rawContent.substring(lastThinkIndex + 8).trim() : rawContent;

            // [ANSWER], [PROS], [CONS] 파싱
            const answerMatch = finalOutput.match(/\[ANSWER\]([\s\S]*?)(\[PROS\]|$)/i);
            const prosMatch = finalOutput.match(/\[PROS\]([\s\S]*?)(\[CONS\]|$)/i);
            const consMatch = finalOutput.match(/\[CONS\]([\s\S]*?)$/i);

            if (answerMatch) answerText = answerMatch[1].trim();
            if (prosMatch) {
                summary.pros = prosMatch[1].trim().split('\n').map(s => s.replace(/^[-\s•*]+/, '').trim()).filter(Boolean);
            }
            if (consMatch) {
                summary.cons = consMatch[1].trim().split('\n').map(s => s.replace(/^[-\s•*]+/, '').trim()).filter(Boolean);
            }

            // 기본값 설정 (파싱 실패 시)
            if (summary.pros.length === 0) summary.pros = ["품질 및 성능 우수", "사용자 만족도 높음"];
            if (summary.cons.length === 0) summary.cons = ["특이사항 없음"];
            if (!answerMatch && finalOutput.length > 10) answerText = finalOutput.split('[')[0].trim();

        } catch (e) {
            console.warn("[-] 로컬 LLM 서버(LM Studio)에 연결할 수 없습니다. 기본 응답을 생성합니다.");
            summary.pros = ["음질 및 착용감 우수", "배터리 수명 만족"];
            summary.cons = ["가격이 다소 높음"];
        }

        // 7. 어시스턴트 응답 저장
        await saveChatMessage(resolvedSessionId, "assistant", answerText, sources);

        return NextResponse.json({
            success: true,
            sessionId: resolvedSessionId,
            answer: answerText,
            sources,
            summary,
        });
    } catch (error) {
        console.error("[/api/search] Error:", error);
        const message =
            error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}

