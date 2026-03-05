import { parse } from "csv-parse/sync";
import { Document } from "@langchain/core/documents";
import * as fs from "fs";
import * as path from "path";

export interface ReviewRecord {
    id: string;
    rating: string;
    title: string;
    content: string;
    author: string;
    date: string;
    helpful_votes: string;
    verified_purchase: string;
}

// CSV 파일 로드 후 LangChain Document 배열로 변환
export function loadReviewDocuments(): Document[] {
    const csvPath = path.join(process.cwd(), "samples", "shop-review.csv");
    const fileContent = fs.readFileSync(csvPath, "utf-8");

    const records: ReviewRecord[] = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true,
    });

    return records.map((record) => {
        const pageContent = [
            `제목: ${record.title}`,
            `내용: ${record.content}`,
            `평점: ${record.rating}점`,
            `작성자: ${record.author}`,
            `날짜: ${record.date}`,
        ].join("\n");

        return new Document({
            pageContent,
            metadata: {
                id: record.id || "",
                rating: Number(record.rating) || 0,
                title: record.title || "",
                author: record.author || "",
                date: record.date || "",
                helpful_votes: Number(record.helpful_votes) || 0,
                verified_purchase: record.verified_purchase === "true",
            },
        });
    });
}
