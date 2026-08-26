import { NextResponse, type NextRequest } from "next/server";

import { generateRecurringTasks } from "@/lib/recurring";

// Prisma 는 Edge 런타임에서 동작하지 않으므로 Node 런타임을 명시합니다.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 반복 업무 생성 크론. vercel.json 의 crons 설정이 매일 새벽 이 경로를 호출합니다.
 * Vercel Cron 은 요청에 `Authorization: Bearer $CRON_SECRET` 헤더를 붙여 보냅니다.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;

  // 시크릿을 설정하지 않은 채로 배포하면 누구나 호출할 수 있으므로 막습니다.
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET 이 설정되지 않았습니다." }, { status: 500 });
  }

  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await generateRecurringTasks();

  return NextResponse.json({
    ok: true,
    ranAt: new Date().toISOString(),
    ...result,
  });
}
