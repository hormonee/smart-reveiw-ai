import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeEmbeddings, PineconeStore } from "@langchain/pinecone";

const INDEX_NAME = "shop-review-assistant";

// Pinecone SDK 클라이언트 (싱글톤)
let _pinecone: Pinecone | null = null;
function getPineconeClient(): Pinecone {
    if (!_pinecone) {
        _pinecone = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY!,
        });
    }
    return _pinecone;
}

// PineconeEmbeddings 인스턴스 (llama-text-embed-v2)
let _embeddings: PineconeEmbeddings | null = null;
function getEmbeddings(): PineconeEmbeddings {
    if (!_embeddings) {
        _embeddings = new PineconeEmbeddings({
            model: "llama-text-embed-v2",
            apiKey: process.env.PINECONE_API_KEY!,
        });
    }
    return _embeddings;
}

// PineconeVectorStore 반환
export async function getPineconeVectorStore(): Promise<PineconeStore> {
    const pinecone = getPineconeClient();
    const index = pinecone.index(INDEX_NAME);
    const embeddings = getEmbeddings();

    return await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex: index,
    });
}

// 문서 임베딩 후 Pinecone에 업로드 (중복 방지를 위해 기존 ID 사용)
export async function upsertDocuments(
    documents: import("@langchain/core/documents").Document[]
) {
    const pinecone = getPineconeClient();
    const index = pinecone.index(INDEX_NAME);
    const embeddings = getEmbeddings();

    const store = await PineconeStore.fromExistingIndex(embeddings, {
        pineconeIndex: index,
    });

    const ids = documents.map(doc => String(doc.metadata.id));
    await store.addDocuments(documents, { ids });

    return documents.length;
}

// 유사도 검색 (상위 k개 반환)
export async function similaritySearch(query: string, k = 5) {
    const vectorStore = await getPineconeVectorStore();
    return await vectorStore.similaritySearch(query, k);
}
