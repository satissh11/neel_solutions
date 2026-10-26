"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { readApiResponse } from "@/lib/api-response";
import { displayProductName, type StoreProduct } from "@/types/store";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export function HomeProductHighlights() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const { homeContent } = useSiteSettings();
  const productName = (name: string) => displayProductName(name);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/v1/products`)
      .then((response) => readApiResponse<StoreProduct[]>(response))
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => setProducts([]));
  }, []);

  return (
    <>
      <section className="home-highlights bg-[#faf8f2] py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          <div className="scroll-reveal mb-12 max-w-2xl md:mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#78977d]">{homeContent.highlightsEyebrow}</p>
            <h2 className="mb-4 text-4xl font-normal leading-tight tracking-[-0.035em] text-[#17151a] md:text-6xl">{homeContent.highlightsTitle}</h2>
            <p className="max-w-xl leading-7 text-[#625f58]">{homeContent.highlightsDescription}</p>
          </div>

          {products.length > 0 && <div className="space-y-16 md:space-y-24">
            {products.slice(0, 2).map((product, index) => (
              <article key={product.id} className="grid items-center gap-8 md:grid-cols-2 md:gap-16">
                <div className={`home-product-image relative aspect-[1.12] overflow-hidden rounded-[1.6rem] border border-[#e8ddca] bg-[#f0efe5] ${index % 2 === 1 ? 'md:order-2' : ''}`}>
                  <Image
                    src={product.images?.[0]?.url || "/admin-nature.svg"}
                    alt={product.images?.[0]?.url ? productName(product.name) : ""}
                    aria-hidden={!product.images?.[0]?.url}
                    fill
                    unoptimized
                    className="scroll-reveal object-cover"
                  />
                  {!product.images?.[0]?.url && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#18382b]/65 to-transparent p-6 pt-16 text-lg text-white">{productName(product.name)}</div>}
                </div>
                <div className={`scroll-reveal max-w-xl py-2 ${index % 2 === 1 ? 'md:order-1 md:justify-self-end' : ''}`}>
                  <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#78977d]">{product.category?.name || "From our collection"}</p>
                  <h3 className="mb-4 text-3xl font-normal leading-tight tracking-[-0.025em] text-[#17151a] md:text-4xl">{productName(product.name)}</h3>
                  <blockquote className="max-w-lg border-l-2 border-[#9caf91] pl-5 font-serif text-xl italic leading-8 text-[#625f58] md:text-2xl">
                    “{homeContent.wellnessQuotes[index] || homeContent.wellnessQuotes[0] || ''}”
                  </blockquote>
                </div>
              </article>
            ))}
          </div>}
        </div>
      </section>

      {homeContent.ingredients.length > 0 && (
        <section className="home-category-rail overflow-hidden border-y border-[#e5d9c2] bg-[#f0efe5] py-12 md:py-16">
          <div className="container mx-auto px-4 md:px-8">
            <p className="scroll-reveal mb-2 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[#78977d]">{homeContent.ingredientsEyebrow}</p>
            <h2 className="scroll-reveal mb-7 text-center text-3xl font-normal tracking-[-0.025em] text-[#17151a] md:text-4xl">{homeContent.ingredientsTitle}</h2>
            <div className="home-category-window -mx-4 overflow-hidden px-4 md:mx-0 md:px-0" aria-label="Scrolling product categories">
              <div className="home-category-track flex w-max gap-4 pb-3 md:gap-5">
                {[0, 1].map((copy) => (
                  <div key={copy} className="flex gap-4 md:gap-5" aria-hidden={copy === 1}>
                    {homeContent.ingredients.map((ingredient) => (
                      <Link key={`${copy}-${ingredient.name}`} href="/products" tabIndex={copy === 1 ? -1 : undefined} className="scroll-reveal home-category-card flex min-w-[190px] flex-col items-center rounded-[1.25rem] border border-[#e4d6bb] bg-[#faf8f2] p-5 text-center transition-colors hover:border-[#9eb39b] hover:bg-white sm:min-w-[220px]">
                        <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-[#e9ecdf] text-[#789b80]" aria-hidden="true">
                          <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 4c-8 0-14 3-14 10a6 6 0 0 0 6 6c7 0 8-8 8-16Z"/><path d="M4 21c2-5 6-8 11-11"/></svg>
                        </span>
                        <span className="block font-serif text-xl text-[#17151a]">{ingredient.name}</span>
                        <span className="mt-2 block text-sm text-[#8c7049]">{ingredient.note}</span>
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
