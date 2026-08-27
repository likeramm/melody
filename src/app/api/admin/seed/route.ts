import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";
import { seedDatabase } from "@/lib/seed";

// bcrypt 와 Prisma 가 필요하므로 Node 런타임에서 실행합니다.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * 데모 환경에 초기 데이터를 넣기 위한 일회성 엔드포인트입니다.
 *
 * 운영 DB 접속 문자열을 로컬로 내려받지 않고 시드를 넣기 위한 장치이며,
 * 데모가 끝나면 이 파일을 삭제해야 합니다.
 * 실수로 호출되지 않도록 POST + CRON_SECRET 인증을 요구합니다.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET 이 설정되지 않았습니다." }, { status: 500 });
  }

  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await seedDatabase(prisma);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
