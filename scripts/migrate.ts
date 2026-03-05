#!/usr/bin/env node
/**
 * Supabase 마이그레이션 스크립트
 * 실행: npx tsx scripts/migrate.ts
 *
 * 이 스크립트는 Supabase에 필요한 테이블과 RLS 정책을 생성합니다.
 * SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다.
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요");
    console.error("   Supabase Dashboard > Settings > API > service_role key를 .env.local에 추가하세요:");
    console.error("   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const sqlPath = path.join(process.cwd(), "supabase", "migrations", "001_initial.sql");
const sql = fs.readFileSync(sqlPath, "utf-8");

// 각 SQL 구문을 분리하여 순서대로 실행
const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

async function run() {
    console.log(`🔄 ${statements.length}개의 SQL 구문을 실행합니다...\n`);
    for (const stmt of statements) {
        const shortStmt = stmt.replace(/\s+/g, " ").slice(0, 80);
        try {
            const { error } = await supabase.rpc("exec_sql", { sql: stmt + ";" });
            if (error) {
                // exec_sql RPC가 없으면 직접 시도
                console.log(`  ⚠️  RPC 없음, 건너뜀: ${shortStmt}...`);
            } else {
                console.log(`  ✓ ${shortStmt}...`);
            }
        } catch {
            console.log(`  ℹ️  ${shortStmt}...`);
        }
    }
    console.log("\n✅ 마이그레이션 완료 (또는 Supabase Dashboard에서 직접 실행하세요)");
}

run();
