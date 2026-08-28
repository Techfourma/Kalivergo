"use client";
import { useMemo, useState, useRef } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import ActionFeedback from "@/components/cms/ActionFeedback";
import { User, Upload, X, Loader2 } from "lucide-react";

interface SocialLinks {
  instagram?: string;
  github?: string;
  linkedin?: string;
  website?: string;
}

interface Experience {
  id: number;
  position: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Skill {
  id: number;
  name: string;
}

interface FormData {
  bio: string;
  experiences: Experience[];
  skills: Skill[];
  socialLinks: SocialLinks;
}

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email?: string | null;
    nim?: string | null;
    role?: string;
    image?: string | null;
    bio?: string | null;
    workExperience?: string | null;
    skills?: string | null;
    instagramUrl?: string | null;
    githubUrl?: string | null;
    linkedinUrl?: string | null;
    websiteUrl?: string | null;
  };
}

const parseSkills = (skills?: string | null): Skill[] => {
  if (!skills) return [];
  return skills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean)
    .map((skill, index) => ({ id: index + 1, name: skill }));
};

const parseExperiences = (workExperience?: string | null): Experience[] => {
  if (!workExperience) {
    return [
      { id: Date.now(), position: "", company: "", startDate: "", endDate: "", description: "" },
    ];
  }

  try {
    const parsed = JSON.parse(workExperience);
    if (Array.isArray(parsed)) {
      return parsed.map((item: any, index: number) => ({
        id: Date.now() + index,
        position: item.position || "",
        company: item.company || "",
        startDate: item.startDate || "",
        endDate: item.endDate || "",
        description: item.description || "",
      }));
    }
  } catch {

}

  return [
    { id: Date.now(), position: "", company: "", startDate: "", endDate: "", description: workExperience },
  ];
};

const serializeExperiences = (experiences: Experience[]) => {
  const filled = experiences.filter(
    (exp) => exp.position || exp.company || exp.startDate || exp.endDate || exp.description
  );

  return filled
    .map((exp) => {
      const lines: string[] = [];
      const title = [exp.position, exp.company].filter(Boolean).join(" di ");
      if (title) lines.push(title);

      const dates = [exp.startDate, exp.endDate].filter(Boolean).join(" — ");
      if (dates) lines.push(dates);

      if (exp.description) lines.push(exp.description);
      return lines.join("\n");
    })
    .join("\n\n");
};

export default function ProfileForm({ user }: ProfileFormProps) {
  const initialFormData = useMemo<FormData>(() => ({
    bio: user.bio || "",
    experiences: parseExperiences(user.workExperience),
    skills: parseSkills(user.skills),
    socialLinks: {
      instagram: user.instagramUrl || "",
      github: user.githubUrl || "",
      linkedin: user.linkedinUrl || "",
      website: user.websiteUrl || "",
    },
  }), [user]);

  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [newSkill, setNewSkill] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(user.image || null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "bio") {
      setFormData((prev) => ({ ...prev, bio: value }));
    }
  };

  const handleSocialChange = (platform: keyof SocialLinks, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value },
    }));
  };

  const handleExperienceChange = (id: number, field: keyof Experience, value: string) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.map((exp) => (exp.id === id ? { ...exp, [field]: value } : exp)),
    }));
  };

  const addExperience = () => {
    const newExp: Experience = {
      id: Date.now(),
      position: "",
      company: "",
      startDate: "",
      endDate: "",
      description: "",
    };
    setFormData((prev) => ({ ...prev, experiences: [...prev.experiences, newExp] }));
  };

  const removeExperience = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      experiences: prev.experiences.filter((exp) => exp.id !== id),
    }));
  };

  const addSkill = () => {
    const skill = newSkill.trim();
    if (!skill) return;

    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, { id: Date.now(), name: skill }],
    }));
    setNewSkill("");
  };

  const removeSkill = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s.id !== id),
    }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "File harus berupa gambar" });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Ukuran file maksimal 2MB" });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);

      const uploadData = new window.FormData();
      uploadData.append("file", file);

      const response = await fetch("/api/upload-profile", {
        method: "POST",
        body: uploadData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal mengupload foto");
      }

      setPreviewImage(data.data.imageUrl);
      setMessage({ type: "success", text: "Foto profil berhasil diubah" });
    } catch (error) {
      console.error("Error uploading image:", error);
      setPreviewImage(user.image || null);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Gagal mengubah foto profil",
      });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = async () => {
    if (!confirm("Yakin ingin menghapus foto profil?")) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/upload-profile", {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Gagal menghapus foto");
      }
      setPreviewImage(null);
      setMessage({ type: "success", text: "Foto profil berhasil dihapus" });
    } catch (error) {
      console.error("Error removing image:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Gagal menghapus foto profil",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch("/api/portofolio/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          bio: formData.bio,
          workExperience: serializeExperiences(formData.experiences),
          skills: formData.skills.map((item) => item.name).join(", "),
          instagramUrl: formData.socialLinks.instagram,
          githubUrl: formData.socialLinks.github,
          linkedinUrl: formData.socialLinks.linkedin,
          websiteUrl: formData.socialLinks.website,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Gagal menyimpan data profil");
      }
      return { success: "Perubahan berhasil" };
    } catch (error) {
      console.error("Error saving profile:", error);
      const errorMessage = error instanceof Error ? error.message : "Gagal menyimpan data profil";
      setMessage({
        type: "error",
        text: errorMessage,
      });
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      MEMBER: "Member",
      OWNER: "Owner",
      SECRETARY: "Sekretaris",
      VICE_TREASURER: "Wakil Bendahara",
      TREASURER: "Bendahara",
      VICE_PRESIDENT: "Wakil Presiden",
      PRESIDENT: "Presiden",
    };
    return roleMap[role] || role;
  };

  return (
    <ActionFeedback actionType="profile" customSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-xl ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400"
              : "bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card padding="lg" className="bg-white border-dark-200 dark:bg-dark-900 dark:border-dark-800">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <div
              className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center overflow-hidden cursor-pointer hover:ring-4 hover:ring-primary-500/50 transition-all duration-300"
              onClick={handleImageClick}
            >
              {isLoading ? (
                <Loader2 className="w-16 h-16 text-dark-900 dark:text-white animate-spin" />
              ) : previewImage ? (
                <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-16 h-16 text-dark-900 dark:text-white" />
              )}
              {!isLoading && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-full">
                  <Upload className="w-8 h-8 text-dark-900 dark:text-white" />
                </div>
              )}
            </div>
            {previewImage && !isLoading && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 p-2 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={isLoading}
            className="hidden"
          />

          <div className="text-center">
            <h3 className="text-lg font-semibold text-dark-900 dark:text-white">{user.name}</h3>
            <p className="text-faint text-sm">{getRoleDisplay(user.role || "MEMBER")}</p>
            <button
              type="button"
              onClick={handleImageClick}
              disabled={isLoading}
              className="mt-2 text-sm text-primary-400 hover:text-primary-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Mengupload..." : "Klik untuk mengubah foto"}
            </button>
          </div>
        </div>
      </Card>

      <Card padding="lg" className="bg-white border-dark-200 dark:bg-dark-900 dark:border-dark-800">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-muted mb-2">Nama Lengkap</label>
            <div className="px-4 py-3 bg-dark-50 dark:bg-dark-800/30 border border-dark-300 dark:border-dark-600 rounded-xl text-dark-900 dark:text-white">{user.name || "-"}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-2">Title / Jabatan</label>
            <div className="px-4 py-3 bg-dark-50 dark:bg-dark-800/30 border border-dark-300 dark:border-dark-600 rounded-xl text-dark-900 dark:text-white">{getRoleDisplay(user.role || "MEMBER")}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-2">NIM</label>
            <div className="px-4 py-3 bg-dark-50 dark:bg-dark-800/30 border border-dark-300 dark:border-dark-600 rounded-xl text-dark-900 dark:text-white">{user.nim || "-"}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted mb-2">Email</label>
            <div className="px-4 py-3 bg-dark-50 dark:bg-dark-800/30 border border-dark-300 dark:border-dark-600 rounded-xl text-dark-900 dark:text-white">{user.email || "-"}</div>
          </div>
        </div>
      </Card>

      <Card padding="lg" className="bg-white border-dark-200 dark:bg-dark-900 dark:border-dark-800">
        <label htmlFor="bio" className="block text-sm font-medium text-muted mb-2">Tentang Saya</label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          value={formData.bio}
          onChange={handleInputChange}
          className="w-full rounded-xl border border-dark-300 bg-white dark:border-dark-600 dark:bg-dark-800 px-4 py-3 text-dark-900 dark:text-white resize-none focus:outline-none focus:border-primary-500"
          placeholder="Ceritakan tentang diri Anda..."
        />
      </Card>

      <Card padding="lg" className="bg-white border-dark-200 dark:bg-dark-900 dark:border-dark-800">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-dark-900 dark:text-white">Pengalaman Kerja</h2>
            <p className="text-sm text-faint">Tambahkan pengalaman dalam format terstruktur.</p>
          </div>
          <Button type="button" variant="secondary" onClick={addExperience} disabled={isLoading}>
            + Tambah Pengalaman
          </Button>
        </div>
        <div className="space-y-4 mt-4">
          {formData.experiences.map((exp) => (
            <div key={exp.id} className="rounded-2xl border border-dark-200 bg-dark-50 dark:border-dark-600 dark:bg-[#0f172a]/70 p-4">
              <div className="grid gap-3 md:grid-cols-2 mb-3">
                <input
                  type="text"
                  value={exp.position}
                  onChange={(e) => handleExperienceChange(exp.id, "position", e.target.value)}
                  placeholder="Posisi"
                  className="w-full rounded-xl border border-dark-300 bg-white dark:border-dark-600 dark:bg-dark-800 px-3 py-2 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => handleExperienceChange(exp.id, "company", e.target.value)}
                  placeholder="Perusahaan"
                  className="w-full rounded-xl border border-dark-300 bg-white dark:border-dark-600 dark:bg-dark-800 px-3 py-2 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="grid gap-3 md:grid-cols-2 mb-3">
                <input
                  type="month"
                  value={exp.startDate}
                  onChange={(e) => handleExperienceChange(exp.id, "startDate", e.target.value)}
                  className="w-full rounded-xl border border-dark-300 bg-white dark:border-dark-600 dark:bg-dark-800 px-3 py-2 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="month"
                  value={exp.endDate}
                  onChange={(e) => handleExperienceChange(exp.id, "endDate", e.target.value)}
                  className="w-full rounded-xl border border-dark-300 bg-white dark:border-dark-600 dark:bg-dark-800 px-3 py-2 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <textarea
                value={exp.description}
                onChange={(e) => handleExperienceChange(exp.id, "description", e.target.value)}
                rows={3}
                placeholder="Deskripsi pengalaman"
                className="w-full rounded-xl border border-dark-300 bg-white dark:border-dark-600 dark:bg-dark-800 px-3 py-2 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <button
                type="button"
                onClick={() => removeExperience(exp.id)}
                className="mt-3 text-sm text-red-500 hover:text-red-400"
              >
                Hapus Pengalaman
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="lg" className="bg-white border-dark-200 dark:bg-dark-900 dark:border-dark-800">
        <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4">Keahlian</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          {formData.skills.map((skill) => (
            <span
              key={skill.id}
              className="inline-flex items-center gap-2 rounded-full bg-primary-500/20 border border-primary-500/30 px-3 py-1 text-sm text-primary-700 dark:text-primary-300"
            >
              {skill.name}
              <button
                type="button"
                onClick={() => removeSkill(skill.id)}
                className="text-primary-600 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-100"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Tambah keahlian baru"
            className="flex-grow rounded-l-xl border border-dark-300 bg-white dark:border-dark-600 dark:bg-dark-800 px-3 py-2 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <button
            type="button"
            onClick={addSkill}
            className="rounded-r-xl bg-primary-500 px-4 py-2 text-white hover:bg-primary-400 transition"
          >
            Tambah
          </button>
        </div>
      </Card>

      <Card padding="lg" className="bg-white border-dark-200 dark:bg-dark-900 dark:border-dark-800">
        <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4">Tautan Sosial</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-muted mb-2">Instagram</label>
            <input
              type="text"
              value={formData.socialLinks.instagram || ""}
              onChange={(e) => handleSocialChange("instagram", e.target.value)}
              placeholder="@username atau link"
              className="w-full rounded-xl border border-dark-600 bg-white dark:bg-dark-800 px-3 py-2 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-2">GitHub</label>
            <input
              type="text"
              value={formData.socialLinks.github || ""}
              onChange={(e) => handleSocialChange("github", e.target.value)}
              placeholder="github.com/username"
              className="w-full rounded-xl border border-dark-600 bg-white dark:bg-dark-800 px-3 py-2 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-2">LinkedIn</label>
            <input
              type="text"
              value={formData.socialLinks.linkedin || ""}
              onChange={(e) => handleSocialChange("linkedin", e.target.value)}
              placeholder="linkedin.com/in/username"
              className="w-full rounded-xl border border-dark-600 bg-white dark:bg-dark-800 px-3 py-2 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-2">Website</label>
            <input
              type="text"
              value={formData.socialLinks.website || ""}
              onChange={(e) => handleSocialChange("website", e.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-xl border border-dark-600 bg-white dark:bg-dark-800 px-3 py-2 text-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          disabled={isLoading}
          onClick={() => setFormData(initialFormData)}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </div>
    </ActionFeedback>
  );
}