"use client";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/actions/cms";
import Navbar from "./Navbar";

interface NavbarWrapperProps {
  user?: {
    name: string;
    email: string;
    image?: string | null;
    role?: string;
    isVerified?: boolean;
  } | null;
  onSignIn?: () => void;
  onSignOut?: () => void | Promise<void>;
}

export default function NavbarWrapper({ user, onSignIn, onSignOut }: NavbarWrapperProps) {
  const router = useRouter();

  const handleSignIn = () => {
    if (onSignIn) {
      onSignIn();
    } else {
      router.push("/login");
    }
  };

  const handleSignOut = async () => {
    if (onSignOut) {
      await onSignOut();
    }

    try {
      await logoutUser();
    } catch (e) {
      console.error("Gagal memanggil logoutUser:", e);
    }


    document.cookie =
      "kalivergo_user=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";

    window.location.replace("/login");
  };

  return (
    <Navbar
      user={user}
      onSignIn={handleSignIn}
      onSignOut={handleSignOut}
    />
  );
}