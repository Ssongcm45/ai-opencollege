import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getPostBySlug } from "@/lib/content";

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post || !post.published) notFound();

  return (
    <>
      <Header />
      <main>
        <section className="page-hero">
          <div className="wrap">
            <div className="ey">{post.category}</div>
            <h1 className="sh2 sh2-lg">{post.title}</h1>
            <p className="sdesc">{post.excerpt}</p>
          </div>
        </section>
        <article className="sec">
          <div className="wrap" style={{ maxWidth: 860 }}>
            <div className="article-body">{post.content}</div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
