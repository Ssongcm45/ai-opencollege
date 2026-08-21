import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getPublishedPosts } from "@/lib/content";

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <>
      <Header />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <div className="ey">BLOG</div>
            <h1 className="sh2 sh2-lg">교육을 설계하고<br />현장을 기록하는 글</h1>
            <p className="sdesc">교육 방법론, 출강 준비, 운영 회고, 기술 문서를 CMS로 관리합니다.</p>
          </div>
        </section>
        <section className="sec">
          <div className="wrap article-grid">
            {posts.map((post) => (
              <article className="article-card" key={post.slug}>
                {post.thumbnailUrl ? <img className="card-thumb" src={post.thumbnailUrl} alt={post.title} loading="lazy" /> : null}
                <div className="blog-meta">{post.category}</div>
                <h2 className="tp-h">{post.title}</h2>
                <p className="tp-p">{post.excerpt}</p>
                <Link className="blog-more" href={`/blog/${post.slug}`}>자세히 보기 →</Link>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
