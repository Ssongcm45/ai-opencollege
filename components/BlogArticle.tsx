import Link from "next/link";
import { toHtmlBody } from "@/lib/html";

type ArticlePost = {
  title: string;
  category: string;
  excerpt: string;
  content: string;
  thumbnailUrl: string | null;
};

// 블로그 글 본문 화면 — 공개 글 페이지와 관리자 미리보기가 같은 모양을 쓴다.
export function BlogArticle({ post, backHref = "/blog", backLabel = "← 블로그 목록으로" }: { post: ArticlePost; backHref?: string; backLabel?: string }) {
  return (
    <>
      <section className="page-hero">
        <div className="wrap">
          <div className="ey">{post.category}</div>
          <h1 className="sh2 sh2-lg">{post.title}</h1>
          <p className="sdesc">{post.excerpt}</p>
        </div>
      </section>
      {post.thumbnailUrl ? (
        <section className="sec video-sec">
          <div className="wrap" style={{ maxWidth: 860 }}>
            <img className="detail-thumb" src={post.thumbnailUrl} alt={post.title} />
          </div>
        </section>
      ) : null}
      <article className="sec">
        <div className="wrap" style={{ maxWidth: 860 }}>
          <div className="article-body" dangerouslySetInnerHTML={{ __html: toHtmlBody(post.content) }} />
          <div className="detail-back">
            <Link href={backHref} className="btn bo btn-pill">{backLabel}</Link>
          </div>
        </div>
      </article>
    </>
  );
}
