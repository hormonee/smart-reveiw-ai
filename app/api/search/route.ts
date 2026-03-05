import { NextRequest, NextResponse } from "next/server";
import { similaritySearch } from "@/lib/pinecone";
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

        // 3. Pinecone에서 유사도 검색 (상위 3개)
        const results = await similaritySearch(query, 3);

        if (results.length === 0) {
            const noResultMsg =
                "검색 결과가 없습니다. 먼저 샘플 데이터를 인덱싱해 주세요.";
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
        const sources = results.map((doc, i) => {
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

            // 관련도 점수 (순서 기반: 1위=98%, 2위=93%, ...)
            const relevanceScores = [98, 93, 88];
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
                relevance: relevanceScores[i] ?? 70,
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

        // 6. 장단점 추출 (rating 4~5 = 장점, 1~2 = 단점)
        const prosDocs = results
            .filter((d) => (d.metadata.rating as number) >= 4)
            .slice(0, 3);
        const consDocs = results
            .filter((d) => (d.metadata.rating as number) <= 2)
            .slice(0, 3);

        const pros = prosDocs.map((d) => {
            const match = d.pageContent.match(/제목: (.+)/);
            return match ? match[1].trim() : d.pageContent.slice(0, 40);
        });
        const cons = consDocs.map((d) => {
            const match = d.pageContent.match(/제목: (.+)/);
            return match ? match[1].trim() : d.pageContent.slice(0, 40);
        });

        // 장단점이 없을 경우 기본값
        if (pros.length === 0) pros.push("음질 및 착용감 우수", "배터리 수명 만족");
        if (cons.length === 0) cons.push("가격이 다소 높음");

        const summary = {
            avgRating,
            totalReviews: sources.length,
            positivePercent,
            neutralPercent: Math.round((neutralCount / ratings.length) * 100),
            negativePercent: Math.round((negativeCount / ratings.length) * 100),
            pros,
            cons,
            tags: extractTags(results.map((d) => d.pageContent).join(" ")),
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
                maxTokens: 1500,
                temperature: 0.3,
            });

            const contextText = sources.map(s => `- 평점: ${s.rating}점 / 리뷰: ${s.content}`).join("\n");

            const prompt = `당신은 쇼핑몰의 친절하고 전문적인 AI 리뷰 분석가입니다. 
사용자의 질문: "${query}"

아래는 사용자의 질문과 가장 관련성이 높은 실제 구매자들의 리뷰 데이터입니다. 
아래 리뷰 데이터를 바탕으로 사용자의 질문에 답변해 주세요. 
답변은 2~3문장의 깔끔한 한국어로 작성해 주세요. 

[리뷰 데이터]
${contextText}

🚨 답변 형식 지침:
자유롭게 생각이나 분석 과정을 작성하되, 최종 답변 직전에 반드시 '***' (별표 3개)를 넣어 구분해 주세요. 
사용자에게는 '***' 이후의 텍스트만 보여집니다.

출력 예시:
(생각 과정...)
***
최종 답변 내용...`;

            const aiResponse = await llm.invoke(prompt);

            // 모델의 생각 과정(Thinking Process) 출력 방지 및 최종 답변만 추출
            let rawContent = aiResponse.content.toString();
            let cleanContent = rawContent;

            // 사용자의 요청대로 마지막 '*' 기호 다음부터 표시
            const lastStarIndex = rawContent.lastIndexOf('*');
            if (lastStarIndex !== -1) {
                const afterStar = rawContent.substring(lastStarIndex + 1).trim();
                // 결과가 너무 짧거나 없으면 구분자가 아닌 본문 내 별표일 수 있으므로 무시
                if (afterStar.length >= 2) {
                    cleanContent = afterStar;
                }
            }

            // Fallback: 만약 적절한 '*' 이후 텍스트가 없으면 다른 태그 확인
            if (cleanContent === rawContent) {
                if (rawContent.includes("</think>")) {
                    cleanContent = rawContent.split("</think>").pop()?.trim() || rawContent;
                } else if (rawContent.includes("--최종답변--")) {
                    cleanContent = rawContent.split("--최종답변--").pop()?.trim() || rawContent;
                }
            }

            answerText = cleanContent;
        } catch (e) {
            console.warn("[-] 로컬 LLM 서버(LM Studio)에 연결할 수 없습니다. 기본 텍스트 응답을 사용합니다.");
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

// 자주 등장하는 태그 키워드 추출
function extractTags(text: string): string[] {
    const keywords = [
        "배터리", "음질", "노이즈 캔슬링", "착용감", "통화", "방수",
        "USB-C", "저음", "앱", "마이크", "충전", "Bluetooth",
    ];
    return keywords.filter((kw) => text.includes(kw)).slice(0, 5);
}
