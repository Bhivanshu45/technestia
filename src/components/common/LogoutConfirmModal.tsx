"use client";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";

interface LogoutModalProps {
  triggerLabel?: ReactNode;
  triggerClassName?: string;
}

const LogoutConfirmModal = ({
  triggerLabel = "SignOut",
  triggerClassName,
}: LogoutModalProps) => {
  const router = useRouter();

  const logoutHandler = async () => {
    await signOut({ redirect: false });
    router.replace("/");
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className={triggerClassName}>
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader className="text-lg font-semibold">
          Are you sure you want to logout?
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={logoutHandler}>
            Yes, Logout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LogoutConfirmModal;
