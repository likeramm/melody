import type { Metadata } from "next";

import { Card, PageHeader, SectionTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { fmtDateTime } from "@/lib/dates";

import { EmailForm, PasswordForm } from "./settings-forms";

export const metadata: Metadata = { title: "계정 설정" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <>
      <PageHeader title="계정 설정" description="로그인에 쓰는 이메일과 비밀번호를 바꿉니다." />

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
              구축 과정에서 공유된 처음 비밀번호를 아직 쓰고 계십니다. 학생 정보를 입력하기 전에
              바꿔 주세요.
            </p>
          )}
          <PasswordForm />
          <p className="mt-4 border-t border-border pt-3 text-xs text-muted">
            이 시스템에는 비밀번호 찾기 기능이 없습니다. 새 비밀번호는 안전한 곳에 적어 두세요.
          </p>
        </Card>
      </div>
    </>
  );
}
