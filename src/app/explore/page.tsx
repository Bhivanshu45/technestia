"use client";
import React from "react";
import Navbar from "@/components/navbar/Navbar";
import ExploreProjectListWrapper from "./ExploreProjectListWrapper";
import SearchBar from "@/components/common/SearchBar";
import { useState } from "react";

const ExplorePage = () => {
  const [search, setSearch] = useState("");
  return (
    <>
      <Navbar />
      <main className="w-full min-h-screen bg-[#18181b] text-[#f4f4f5e4] px-0 md:px-0 overflow-x-hidden">
        <section className="w-full flex flex-col items-center justify-center pt-10 pb-4 bg-[#232326] border-b border-[#232326]">
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

export default ExplorePage;
