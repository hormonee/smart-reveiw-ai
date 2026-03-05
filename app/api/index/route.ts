import { NextRequest, NextResponse } from "next/server";
import { loadReviewDocuments } from "@/lib/csvLoader";
import { upsertDocuments } from "@/lib/pinecone";
import { logIndexing } from "@/lib/supabase";

export async function POST(_req: NextRequest) {
    try {
        // 1. CSV 로드 → LangChain Documents
        const documents = loadReviewDocuments();

        // 2. Pinecone에 임베딩 + 업로드 (배치 처리)
        const BATCH_SIZE = 25;
        let uploaded = 0;
        for (let i = 0; i < documents.length; i += BATCH_SIZE) {
            const batch = documents.slice(i, i + BATCH_SIZE);
            await upsertDocuments(batch);
            uploaded += batch.length;
        }

        // 3. Supabase에 인덱싱 완료 기록
        await logIndexing("samples/shop-review.csv", uploaded);

        return NextResponse.json({
            success: true,
            count: uploaded,
            message: `${uploaded}개의 리뷰가 성공적으로 인덱싱되었습니다.`,
        });
    } catch (error) {
        console.error("[/api/index] Error:", error);
        const message =
            error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
        return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
}
