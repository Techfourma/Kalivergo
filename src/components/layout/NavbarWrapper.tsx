import { getNavbarHomeHref } from "@/lib/navbar-home";
import { defaultSignOut, redirectToLogin } from "@/actions/navbar-actions";
import Navbar from "./Navbar";

interface NavbarWrapperProps {
  user?: {
    name: string;
    email: string;
    image?: string | null;
    role?: string;
    isVerified?: boolean;
  } | null;
  onSignIn?: () => void | Promise<void>;
  onSignOut?: () => void | Promise<void>;
  homeHref?: string;
}

export default async function NavbarWrapper({
  user,
  onSignIn,
  onSignOut,
  homeHref,
}: NavbarWrapperProps) {
  const computedHomeHref = homeHref ?? await getNavbarHomeHref();

  return (
    <Navbar
      user={user}
      onSignIn={onSignIn ?? redirectToLogin}
      onSignOut={onSignOut ?? defaultSignOut}
      homeHref={computedHomeHref}
    />
  );
}
