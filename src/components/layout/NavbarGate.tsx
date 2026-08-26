"use client";

import { usePathname } from "next/navigation";
import TenantNavbar from "./TenantNavbar";

type NavbarGateProps = {
  user?: React.ComponentProps<typeof TenantNavbar>["user"];
  tenantPath: string;
};

export default function NavbarGate({ user, tenantPath }: NavbarGateProps) {
  const pathname = usePathname() || "";
  const isCmsRoute = pathname.split("/").includes("cms");

  if (isCmsRoute) {
    return null;
  }

  return <TenantNavbar user={user} tenantPath={tenantPath} />;
}