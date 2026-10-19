import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/BlogArticle";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { requireAdminSession } from "@/lib/auth";
import { getPostById } from "@/lib/content";

// 관리자 전용 미리보기. 초안(비공개) 글도 공개 화면과 같은 모양으로 확인한다.
// middleware.ts 가 /admin 쿠키를 확인하고, 여기서 세션 버전까지 다시 확인한다.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "미리보기 · 관리자", robots: { index: false, follow: false } };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function BlogPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const post = await getPostById(id);
  if (!post) notFound();

  return (
    <>
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
        padding: "12px 24px", background: post.published ? "#0E1B3C" : "#E85A3E", color: "#fff", fontSize: 13
      }}>
        <span>
          <strong>미리보기</strong> · {post.published ? "공개된 글입니다." : "초안(비공개) 상태라 아직 블로그에 공개되지 않았습니다."}
          {post.createdByAgent ? ` · 에이전트 등록: ${post.createdByAgent}` : ""}
        </span>
        <span style={{ display: "flex", gap: 14 }}>
          <Link href={`/admin/blog/${post.id}`} style={{ color: "#fff", fontWeight: 700, textDecoration: "underline" }}>수정·공개하기</Link>
          <Link href="/admin/blog" style={{ color: "#fff" }}>목록</Link>
        </span>
      </div>
      <Header />
      <main>
        <BlogArticle post={post} backHref="/admin/blog" backLabel="← 관리자 블로그 목록으로" />
      </main>
      <Footer />
    </>
  );
}
