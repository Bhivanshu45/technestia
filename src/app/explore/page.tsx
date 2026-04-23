"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Navbar from "@/components/navbar/Navbar";
import SearchBar from "@/components/common/SearchBar";
import ExploreProjectListWrapper from "./ExploreProjectListWrapper";

const ExplorePageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("query") ?? "";
  const [search, setSearch] = useState(urlQuery);

  useEffect(() => {
    setSearch(urlQuery);
  }, [urlQuery]);

  const handleSearchSubmit = (query: string) => {
    const nextQuery = query.trim();
    router.replace(
      nextQuery ? `/explore?query=${encodeURIComponent(nextQuery)}` : "/explore",
    );
  };

  return (
    <>
      <Navbar />
      <main className="w-full min-h-screen bg-transparent text-[#f4f4f5e4] px-0 md:px-0 overflow-x-hidden pt-28 md:pt-24">
        <section className="w-full flex flex-col items-center justify-center pt-8 pb-4 bg-white/5 border-b border-white/10 backdrop-blur-sm">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center">
            Discover Public Projects
          </h1>
          <p className="text-[#A1A1AA] text-base mb-6 text-center max-w-2xl">
            Browse, search, and explore the best public projects from our
            community.
          </p>
          <div className="w-full max-w-2xl mb-6">
            <SearchBar
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSubmit={handleSearchSubmit}
              placeholder="Search projects by name, tag, or creator..."
            />
          </div>
        </section>

        <section className="w-full flex flex-col items-center justify-center py-8 px-2">
          <div className="w-full max-w-6xl">
            <ExploreProjectListWrapper searchTerm={search} />
          </div>
        </section>
      </main>
    </>
  );
};

export default function ExplorePage() {
  return (
    <Suspense fallback={null}>
      <ExplorePageContent />
    </Suspense>
  );
}
