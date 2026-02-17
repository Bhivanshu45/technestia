'use client'
import Link from "next/link";
import SearchBar from "../common/SearchBar";
import { Button } from "../ui/button";
import { Bell, MessageCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import UserMenu from "./UserMenu";
import { useChatRooms } from "@/hooks/useChatRooms";

const Navbar = () => {
  const { data: session } = useSession();
  const { totalUnreadCount } = useChatRooms();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full flex items-center text-white bg-[#0D0D0D] border-b-2 border-[#52525B]">
      <div className="w-full flex flex-col justify-center items-center py-2">
        <div className="w-[97%] px-2 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <img
              src="/android-chrome-192x192.png"
              alt="Technestia Logo"
              className="md:w-8 w-6 rounded-full"
            />
            <h1 className="md:text-3xl text-2xl font-bold">Technestia</h1>
          </Link>
          <div className="flex flex-row md:gap-4 gap-2 p-2">
            {/* visible on desktop devices */}
            <div className="hidden md:flex items-center mx-2">
              <SearchBar />
            </div>

            {/* Chat Icon with Unread Badge */}
            {session?.user && (
              <Link href="/chat">
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer hover:bg-[#52525B] relative"
                >
                  <MessageCircle className="h-6 w-6" />
                  {totalUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] font-semibold flex items-center justify-center">
                      {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {/* Notification Icon */}
            {session?.user && (
              <Button
                variant="ghost"
                size="icon"
                className="cursor-pointer hover:bg-[#52525B]"
              >
                <Bell className="h-8 w-8" />
              </Button>
            )}

            {/* Login / User Menu */}
            {session?.user ? (
              <UserMenu user={session.user} />
            ) : (
              <Link href="/auth/sign-in">
                <Button
                  variant="secondary"
                  size="default"
                  className="cursor-pointer"
                >
                  Login
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* visible on mobile devices */}
        <div className="md:hidden flex justify-between items-center w-[95vw] mt-2 py-2 px-6">
          <SearchBar />
        </div>
      </div>
    </nav>
  );
}

export default Navbar
