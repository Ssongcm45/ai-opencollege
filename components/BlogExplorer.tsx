"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type BlogItem = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  thumbnailUrl: string | null;
};

export function BlogExplorer({ posts }: { posts: BlogItem[] }) {
  const [category, setCategory] = useState("ALL");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const categoryParam = params.get("category");
    const queryParam = params.get("q");

    if (categoryParam && (categoryParam === "ALL" || posts.some((post) => post.category === categoryParam))) {
      setCategory(categoryParam);
    }

    if (queryParam) {
      setQuery(queryParam);
    }
  }, [posts]);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (category === "ALL") {
      url.searchParams.delete("category");
    } else {
      url.searchParams.set("category", category);
    }

    if (query) {
      url.searchParams.set("q", query);
    } else {
      url.searchParams.delete("q");
    }

    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }, [category, query]);

  const categories = Array.from(new Set(posts.map((post) => post.category)));
  const q = query.trim().toLowerCase();
  const filtered = posts.filter(
    (post) =>
      (category === "ALL" || post.category === category) &&
      (!q || post.title.toLowerCase().includes(q) || post.excerpt.toLowerCase().includes(q)),
  );

  return (
    <>
      <div className="blog-toolbar">
        <div className="blog-chips">
          <button className={`chip${category === "ALL" ? " on" : ""}`} onClick={() => setCategory("ALL")} type="button">
            전체
          </button>
          {categories.map((item) => (
            <button className={`chip${category === item ? " on" : ""}`} key={item} onClick={() => setCategory(item)} type="button">
              {item}
            </button>
          ))}
        </div>
        <div className="blog-search">
          <input aria-label="제목·요약 검색" onChange={(event) => setQuery(event.target.value)} placeholder="제목·요약 검색" type="search" value={query} />
          {query ? (
            <button aria-label="검색어 지우기" className="blog-search-clear" onClick={() => setQuery("")} type="button">
              ×
            </button>
          ) : null}
        </div>
      </div>
      {category !== "ALL" || q ? <p className="blog-count">{filtered.length}개의 글</p> : null}
      {filtered.length ? (
        <div className="article-grid">
          {filtered.map((post) => (
            <article className="article-card" key={post.slug}>
              {post.thumbnailUrl ? <img alt={post.title} className="card-thumb" loading="lazy" src={post.thumbnailUrl} /> : null}
              <span className="blog-meta">{post.category}</span>
              <h2 className="tp-h">{post.title}</h2>
              <p className="tp-p">{post.excerpt}</p>
              <Link className="blog-more" href={`/blog/${post.slug}`}>자세히 보기 →</Link>
            </article>
          ))}
        </div>
      ) : (
        <p className="blog-empty">검색 결과가 없습니다.</p>
      )}
    </>
  );
}
