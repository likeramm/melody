/**
 * 화면을 옮기는 동안 보여주는 자리 표시.
 * 서버가 잠에서 깨는 첫 접속(2초 안팎)에도 멈춘 게 아니라 불러오는 중임을 알립니다.
 * 사이드바는 그대로 두고 본문 자리만 바뀝니다.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-label="불러오는 중" className="animate-pulse">
      <div className="mb-7">
        <div className="h-7 w-44 rounded-md bg-slate-200/80" />
        <div className="mt-3 h-1 w-16 rounded bg-gold-200" />
        <div className="mt-3 h-3.5 w-72 max-w-full rounded bg-slate-200/60" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[92px] rounded-xl border border-border bg-card" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-56 rounded-xl border border-border bg-card lg:col-span-2" />
        <div className="h-56 rounded-xl border border-border bg-card" />
      </div>
    </div>
  );
}
