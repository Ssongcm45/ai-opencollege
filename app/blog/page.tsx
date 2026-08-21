import { BlogExplorer } from "@/components/BlogExplorer";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getPublishedPosts } from "@/lib/content";

export default async function BlogPage() {
  const posts = await getPublishedPosts();
  const items = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    thumbnailUrl: p.thumbnailUrl ?? null,
  }));

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
          <div className="wrap">
            <BlogExplorer posts={items} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
