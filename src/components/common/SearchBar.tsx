'use client'

import { SearchIcon } from "lucide-react"
import { Input } from "../ui/input"
import { Button } from "../ui/button"

const SearchBar = () => {
  return (
    <div className="md:max-w-[500px] w-full flex items-center justify-between">
      <Input className="rounded-r-none border-gray-700" placeholder="Search for relevant projects" />
      <Button variant="secondary" className="bg-blue-600 hover:bg-blue-400 font-bold text-xl rounded-l-none">
        <SearchIcon />
      </Button>
    </div>
  );
}

export default SearchBar
