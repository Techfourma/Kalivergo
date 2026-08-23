export interface OrgMember {
  id: string;
  name: string;
  fullName: string;
  email: string;
  role: string;
  image?: string | null;
}

export const getNickname = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0];
};

const getProfileImage = (imageUrl: string | null | undefined): string | null => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  return null;
};

export const convertUserToOrgMember = (user: {
  id: string;
  name: string;
  email?: string | null;
  role?: string;
  image?: string | null;
  tenantRole?: string | null;
  cmsRole?: string | null;
}): OrgMember => {
  const fullName = user.name || "";
  const nickname = getNickname(fullName);

  const displayRole =
    user.cmsRole ||
    user.role ||
    (user.tenantRole === "OWNER" ? "OWNER" : "MEMBER");

  return {
    id: user.id,
    name: nickname,
    fullName,
    email: user.email || "",
    role: displayRole,
    image: getProfileImage(user.image),
  };
};