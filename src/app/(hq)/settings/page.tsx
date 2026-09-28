import type { Metadata } from "next";

import { ConfirmButton } from "@/components/confirm-button";
import { Badge, Card, PageHeader, SectionTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { fmtDateTime } from "@/lib/dates";
import { ROLE_LABEL } from "@/lib/labels";
import { prisma } from "@/lib/prisma";

import { setAccountActive } from "./actions";
import { EmailForm, NewAccountForm, PasswordForm } from "./settings-forms";

export const metadata: Metadata = { title: "계정 설정" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  // 계정 관리는 원장 계정만 합니다.
  const isAdmin = user.role === "ADMIN";
  const accounts = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, isActive: true, lastLoginAt: true },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
  });

  return (
    <>
      <PageHeader
        title="계정 설정"
        description="로그인에 쓰는 이메일과 비밀번호를 바꾸고, 함께 쓸 계정을 관리합니다."
      />

      <div className="grid max-w-3xl gap-4">
        <Card>
          <SectionTitle title="계정 정보" />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
            <div className="min-w-0">
              <dt className="text-xs text-muted">이름</dt>
              <dd className="mt-0.5 truncate text-sm font-medium">{user.name}</dd>
            </div>
            <div className="min-w-0 sm:col-span-1">
              <dt className="text-xs text-muted">로그인 이메일</dt>
              <dd className="mt-0.5 truncate text-sm font-medium">{user.email}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-muted">마지막 로그인</dt>
              <dd className="mt-0.5 text-sm font-medium">{fmtDateTime(user.lastLoginAt)}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-muted">비밀번호 변경</dt>
              <dd className="mt-0.5 text-sm font-medium">
                {user.passwordChangedAt ? fmtDateTime(user.passwordChangedAt) : "바꾼 적 없음"}
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <SectionTitle
            title="이메일 변경"
            description="다음 로그인부터 새 이메일로 들어오시면 됩니다."
          />
          <EmailForm currentEmail={user.email} />
        </Card>

        <Card>
          <SectionTitle
            title="비밀번호 변경"
            description="바꾸면 이 기기를 뺀 다른 모든 기기에서 로그아웃됩니다."
          />
          {!user.passwordChangedAt && (
            <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2.5 text-[13px] text-rose-700">
              처음 받은 비밀번호를 아직 쓰고 계십니다. 학생 정보를 입력하기 전에 본인만 아는
              비밀번호로 바꿔 주세요.
            </p>
          )}
          <PasswordForm />
          <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
            이 시스템에는 비밀번호 찾기 기능이 없습니다. 새 비밀번호는 안전한 곳에 적어 두세요.
          </p>
        </Card>

        {isAdmin && (
          <Card>
            <SectionTitle
              title="계정 관리"
              description="이 시스템에 로그인할 수 있는 사람입니다. 추가한 계정(담당자)도 학원 데이터는 똑같이 보고 입력하지만, 계정 관리는 원장 계정에서만 할 수 있습니다."
            />
            <ul className="mb-4 divide-y divide-border">
              {accounts.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <span className={a.isActive ? "" : "text-muted line-through"}>{a.name}</span>
                      <Badge tone={a.role === "ADMIN" ? "brand" : "neutral"}>
                        {ROLE_LABEL[a.role]}
                      </Badge>
                      {a.id === user.id && <Badge tone="gold">나</Badge>}
                      {!a.isActive && <Badge>사용 중지</Badge>}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {a.email} · 마지막 로그인 {fmtDateTime(a.lastLoginAt)}
                    </p>
                  </div>
                  {/* 자기 계정은 끌 수 없어, 로그인할 수 있는 계정이 하나도 없는 상황을 막습니다. */}
                  {a.id !== user.id && (
                    <form action={setAccountActive}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="active" value={a.isActive ? "false" : "true"} />
                      {a.isActive ? (
                        <ConfirmButton
                          icon={false}
                          label="사용 중지"
                          confirmLabel="바로 로그아웃되고 다시 로그인할 수 없습니다."
                          actionLabel="중지"
                        />
                      ) : (
                        <button
                          type="submit"
                          className="rounded-lg border border-border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                        >
                          다시 사용
                        </button>
                      )}
                    </form>
                  )}
                </li>
              ))}
            </ul>
            <NewAccountForm />
            <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
              계정을 지우지 않고 사용 중지만 하므로, 그 사람이 남긴 기록은 그대로 남습니다.
            </p>
          </Card>
        )}
      </div>
    </>
  );
}
