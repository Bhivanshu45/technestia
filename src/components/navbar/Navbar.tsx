"use client";
import Link from "next/link";
import { useEffect, useCallback, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SearchBar from "../common/SearchBar";
import { Button } from "../ui/button";
import { Bell, MessageCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import UserMenu from "./UserMenu";
import { useChatRooms } from "@/hooks/useChatRooms";
import { useNotifications } from "@/hooks/useNotifications";
import { getSocket } from "@/socket";
import { toast } from "sonner";

type SearchProjectSuggestion = {
  id: number;
  title?: string;
  description?: string;
};

const Navbar = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { totalUnreadCount, mutate } = useChatRooms();
  const { unreadCount: notificationUnreadCount } = useNotifications();
  const shownNotificationIdsRef = useRef<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchProjectSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentChatRoomId = pathname?.startsWith("/chat/")
    ? Number(pathname.split("/")[2])
    : null;

  const handleGlobalSearch = useCallback(
    (query: string) => {
      const trimmedQuery = query.trim();
      router.push(
        trimmedQuery
          ? `/explore?query=${encodeURIComponent(trimmedQuery)}`
          : "/explore",
      );
    },
    [router],
  );

  useEffect(() => {
    const currentQuery =
      pathname === "/explore"
        ? new URLSearchParams(window.location.search).get("query") || ""
        : "";

    setSearchQuery(currentQuery);
  }, [pathname]);

  useEffect(() => {
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setIsSearching(true);
        const response = await fetch(
          `/api/search/projects?query=${encodeURIComponent(trimmed)}`,
        );
        const payload = await response.json();
        const nextSuggestions = Array.isArray(payload?.data)
          ? payload.data.slice(0, 5)
          : [];
        setSuggestions(nextSuggestions);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 260);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleSuggestionClick = (projectId: number) => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    setShowSuggestions(false);
    router.push(`/project/${projectId}`);
  };

  const handleSearchFocus = () => {
    if (blurTimerRef.current) {
      clearTimeout(blurTimerRef.current);
      blurTimerRef.current = null;
    }
    setShowSuggestions(true);
  };

  const handleSearchBlur = () => {
    blurTimerRef.current = setTimeout(() => {
      setShowSuggestions(false);
    }, 120);
  };

  const handleRoomSync = useCallback(
    (payload: {
      chatRoomId: number;
      latestMessage?: string | null;
      latestMessageAt?: string | Date | null;
      latestMessageSender?: string | null;
      unreadCount?: number;
    }) => {
      mutate(
        (prev: any) => {
          if (!prev?.chatRooms) return prev;

          const updated = prev.chatRooms.map((room: any) => {
            if (room.id !== payload.chatRoomId) return room;

            return {
              ...room,
              latestMessage:
                payload.latestMessage !== undefined
                  ? payload.latestMessage
                  : room.latestMessage,
              latestMessageAt:
                payload.latestMessageAt !== undefined
                  ? payload.latestMessageAt
                  : room.latestMessageAt,
              latestMessageSender:
                payload.latestMessageSender !== undefined
                  ? payload.latestMessageSender
                  : room.latestMessageSender,
              unreadCount:
                currentChatRoomId === payload.chatRoomId
                  ? 0
                  : payload.unreadCount !== undefined
                  ? payload.unreadCount
                  : room.unreadCount,
            };
          });

          updated.sort((a: any, b: any) => {
            const ta = a.latestMessageAt
              ? new Date(a.latestMessageAt).getTime()
              : 0;
            const tb = b.latestMessageAt
              ? new Date(b.latestMessageAt).getTime()
              : 0;
            return tb - ta;
          });

          return { ...prev, chatRooms: updated };
        },
        { revalidate: false },
      );
    },
    [currentChatRoomId, mutate],
  );

  useEffect(() => {
    if (!session?.user?.id) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    socket.on("chat:room:sync", handleRoomSync);

    return () => {
      socket.off("chat:room:sync", handleRoomSync);
    };
  }, [session?.user?.id, handleRoomSync]);

  useEffect(() => {
    if (!session?.user?.id) return;

    const socket = getSocket();
    if (!socket.connected) socket.connect();

    const handleNotificationNew = (payload: {
      id?: number;
      message?: string;
    }) => {
      if (!payload?.id) return;
      if (shownNotificationIdsRef.current.has(payload.id)) return;
      shownNotificationIdsRef.current.add(payload.id);

      if (pathname?.startsWith("/activity/notifications")) return;

      toast.info(payload.message || "You have a new notification", {
        action: {
          label: "View",
          onClick: () => {
            window.location.href = "/activity/notifications";
          },
        },
      });
    };

    socket.on("notification:new", handleNotificationNew);

    return () => {
      socket.off("notification:new", handleNotificationNew);
    };
  }, [session?.user?.id, pathname]);

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
            <div className="hidden md:flex items-center mx-2 relative">
              <SearchBar
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onSubmit={handleGlobalSearch}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                placeholder="Search projects to explore"
              />

              {showSuggestions && (
                <div className="absolute top-full left-0 mt-2 w-full rounded-xl border border-zinc-700 bg-[#111114] shadow-xl overflow-hidden">
                  {!searchQuery.trim() ? (
                    <p className="px-4 py-3 text-sm text-zinc-400">
                      Start typing to search projects.
                    </p>
                  ) : isSearching ? (
                    <p className="px-4 py-3 text-sm text-zinc-400">Searching...</p>
                  ) : suggestions.length === 0 ? (
                    <div className="px-4 py-3">
                      <p className="text-sm text-zinc-300">No project matches found.</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        Press Enter to open full Explore results.
                      </p>
                    </div>
                  ) : (
                    <div>
                      {suggestions.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleSuggestionClick(item.id)}
                          className="w-full text-left px-4 py-3 hover:bg-zinc-800/80 border-b border-zinc-800 last:border-b-0"
                        >
                          <p className="text-sm text-zinc-100 line-clamp-1">
                            {item.title || "Untitled project"}
                          </p>
                          <p className="text-xs text-zinc-400 line-clamp-1 mt-1">
                            {item.description || "Open project profile"}
                          </p>
                        </button>
                      ))}
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleGlobalSearch(searchQuery)}
                        className="w-full text-left px-4 py-3 bg-[#0d0d10] text-cyan-300 hover:bg-zinc-800/70 text-sm"
                      >
                        View all results in Explore
                      </button>
                    </div>
                  )}
                </div>
              )}
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
                      {totalUnreadCount > 9 ? "9+" : totalUnreadCount}
                    </span>
                  )}
                </Button>
              </Link>
            )}

            {/* Notification Icon */}
            {session?.user && (
              <Link href="/activity/notifications">
                <Button
                  variant="ghost"
                  size="icon"
                  className="cursor-pointer hover:bg-[#52525B] relative"
                >
                  <Bell className="h-8 w-8" />
                  {notificationUnreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-5 h-5 text-[10px] font-semibold flex items-center justify-center">
                      {notificationUnreadCount > 9 ? "9+" : notificationUnreadCount}
                    </span>
                  )}
                </Button>
              </Link>
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
        <div className="md:hidden flex justify-between items-center w-[95vw] mt-2 py-2 px-6 relative">
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSubmit={handleGlobalSearch}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            placeholder="Search projects to explore"
          />

          {showSuggestions && (
            <div className="absolute top-full left-6 right-6 mt-2 rounded-xl border border-zinc-700 bg-[#111114] shadow-xl overflow-hidden md:hidden">
              {!searchQuery.trim() ? (
                <p className="px-4 py-3 text-sm text-zinc-400">
                  Start typing to search projects.
                </p>
              ) : isSearching ? (
                <p className="px-4 py-3 text-sm text-zinc-400">Searching...</p>
              ) : suggestions.length === 0 ? (
                <div className="px-4 py-3">
                  <p className="text-sm text-zinc-300">No project matches found.</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Press Enter to open full Explore results.
                  </p>
                </div>
              ) : (
                <div>
                  {suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSuggestionClick(item.id)}
                      className="w-full text-left px-4 py-3 hover:bg-zinc-800/80 border-b border-zinc-800 last:border-b-0"
                    >
                      <p className="text-sm text-zinc-100 line-clamp-1">
                        {item.title || "Untitled project"}
                      </p>
                      <p className="text-xs text-zinc-400 line-clamp-1 mt-1">
                        {item.description || "Open project profile"}
                      </p>
                    </button>
                  ))}
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleGlobalSearch(searchQuery)}
                    className="w-full text-left px-4 py-3 bg-[#0d0d10] text-cyan-300 hover:bg-zinc-800/70 text-sm"
                  >
                    View all results in Explore
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
