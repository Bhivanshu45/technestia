"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { LogOut, Settings, User, X } from "lucide-react";
import LogoutConfirmModal from "../common/LogoutConfirmModal";
import { Separator } from "@/components/ui/separator";

const UserMenu = ({ user }: { user: any }) => {
  return (
    <Sheet modal={false}>
      <SheetTrigger asChild>
        <Button className="rounded-full p-0 h-10 w-10" variant="ghost">
          <Image
            src={user?.image || "/default-avatar.png"}
            alt={user.username || "User"}
            width={38}
            height={38}
            className="rounded-full object-cover"
            priority
          />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex flex-col p-4 w-80 max-w-[90%] bg-[#0D0D0D] text-white"
      >
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Image
              src={user?.image || "/default-avatar.png"}
              alt={user.username || "User"}
              width={38}
              height={38}
              className="rounded-full object-cover"
            />
            <div>
              <div className="font-semibold text-lg">{user.username}</div>
              <div className="text-sm text-gray-500">
                {user.name || "Your Name"}
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-2" />

        {/* Refined Meta Options */}

        <div className="flex flex-col gap-2">
          <SheetClose asChild>
            <Button variant="default" className="justify-start gap-2" asChild>
              <a href="/dashboard/profile">
                <User className="h-4 w-4" /> My Profile
              </a>
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button variant="default" className="justify-start gap-2" asChild>
              <a href="/dashboard/projects">
                <User className="h-4 w-4" /> Projects
              </a>
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button variant="default" className="justify-start gap-2" asChild>
              <a href="/dashboard/collaborations">
                <User className="h-4 w-4" /> Collaborations
              </a>
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button variant="default" className="justify-start gap-2" asChild>
              <a href="/dashboard/chats">
                <User className="h-4 w-4" /> Chats
              </a>
            </Button>
          </SheetClose>
          {/* show contributing milestones inside achievements */}
          <SheetClose asChild>
            <Button variant="default" className="justify-start gap-2" asChild>
              <a href="/dashboard/achievements">
                <User className="h-4 w-4" /> Achievements
              </a>
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button variant="default" className="justify-start gap-2" asChild>
              <a href="/dashboard/activity">
                <User className="h-4 w-4" /> Activity
              </a>
            </Button>
          </SheetClose>
          {/* Add more as needed */}

          <SheetClose asChild>
            <Button variant="default" className="justify-start gap-2" asChild>
              <a href="/dashboard/settings">
                <Settings className="h-4 w-4" /> Settings
              </a>
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <LogoutConfirmModal
              triggerLabel={
                <div className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </div>
              }
              triggerClassName="justify-start w-full"
            />
          </SheetClose>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UserMenu;
