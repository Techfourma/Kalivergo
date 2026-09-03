"use client";
import { useState } from "react";
import ActionFeedback from "@/components/cms/ActionFeedback";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { User, Mail, Briefcase, GraduationCap, Link as LinkIcon, Github, Linkedin, Instagram, Globe, Edit, Save, X } from "lucide-react";
import Image from "next/image";

export interface PortfolioUser {
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
}

interface PortfolioViewProps {
  portfolioUser: PortfolioUser;
  currentUser: PortfolioUser | null;
}

export default function PortfolioView({ portfolioUser, currentUser }: PortfolioViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: portfolioUser.bio || "",
    workExperience: portfolioUser.workExperience || "",
    skills: portfolioUser.skills || "",
    instagramUrl: portfolioUser.instagramUrl || "",
    githubUrl: portfolioUser.githubUrl || "",
    linkedinUrl: portfolioUser.linkedinUrl || "",
    websiteUrl: portfolioUser.websiteUrl || "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const canEdit = currentUser?.id === portfolioUser.id || currentUser?.role === 'ADMIN';

  const handleSave = async (): Promise<{ success?: string; error?: string }> => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/portofolio/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: portfolioUser.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal memperbarui portfolio');
      }

      setMessage({ type: 'success', text: 'Berhasil disimpan' });
      setIsEditing(false);
      return { success: 'Berhasil disimpan' };
    } catch (error) {
      console.error("Error updating portfolio:", error);
      const errorMessage = error instanceof Error ? error.message : 'Gagal memperbarui portfolio';
      setMessage({
        type: 'error',
        text: errorMessage
      });
      return { error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      bio: portfolioUser.bio || "",
      workExperience: portfolioUser.workExperience || "",
      skills: portfolioUser.skills || "",
      instagramUrl: portfolioUser.instagramUrl || "",
      githubUrl: portfolioUser.githubUrl || "",
      linkedinUrl: portfolioUser.linkedinUrl || "",
      websiteUrl: portfolioUser.websiteUrl || "",
    });
    setIsEditing(false);
    setMessage(null);
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      MEMBER: "Member",
      SECRETARY: "Sekretaris",
      VICE_TREASURER: "Wakil Bendahara",
      TREASURER: "Bendahara",
      VICE_PRESIDENT: "Wakil Presiden",
      PRESIDENT: "Presiden",
      ADMIN: "Admin",
    };
    return roleMap[role] || role;
  };

  const SocialLink = ({ url, icon: Icon, label }: { url: string | null | undefined; icon: any; label: string }) => {
    if (!url) return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-muted hover:text-primary-400 transition-colors"
      >
        <Icon className="h-5 w-5" />
        <span className="text-sm">{label}</span>
      </a>
    );
  };

  return (
    <ActionFeedback actionType="portfolio" customSubmit={handleSave} className="space-y-6">
      <div className="space-y-6">
        {message && (
          <div
            className={`p-4 rounded-xl ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Header Section */}
        <Card padding="lg">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center overflow-hidden">
                {portfolioUser.image ? (
                  <Image
                    src={portfolioUser.image}
                    alt={portfolioUser.name}
                    width={128}
                    height={128}
                    className="object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-dark-900 dark:text-white" />
                )}
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-dark-900 dark:text-white font-display">{portfolioUser.name}</h1>
              <p className="text-primary-400 mt-1">{getRoleDisplay(portfolioUser.role || 'MEMBER')}</p>
              {portfolioUser.nim && (
                <p className="text-faint text-sm mt-1">NIM: {portfolioUser.nim}</p>
              )}
              {portfolioUser.email && (
                <div className="flex items-center justify-center md:justify-start gap-2 mt-2 text-muted">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{portfolioUser.email}</span>
                </div>
              )}
            </div>

            {canEdit && (
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setIsEditing(true)}
                    disabled={isLoading}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Portfolio
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      disabled={isLoading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {isLoading ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* About Me / Bio */}
        <Card padding="lg">
          <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary-400" />
            Tentang Saya
          </h2>
          {isEditing ? (
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-4 py-3 bg-dark-800/30 border border-dark-600 rounded-xl text-dark-900 dark:text-white resize-none focus:outline-none focus:border-primary-500"
              rows={4}
              placeholder="Ceritakan tentang diri Anda..."
            />
          ) : (
            <p className="text-muted leading-relaxed">
              {portfolioUser.bio || "Belum ada biografi."}
            </p>
          )}
        </Card>

        {/* Work Experience */}
        <Card padding="lg">
          <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary-400" />
            Pengalaman Kerja
          </h2>
          {isEditing ? (
            <textarea
              value={formData.workExperience}
              onChange={(e) => setFormData({ ...formData, workExperience: e.target.value })}
              className="w-full px-4 py-3 bg-dark-800/30 border border-dark-600 rounded-xl text-dark-900 dark:text-white resize-none focus:outline-none focus:border-primary-500"
              rows={4}
              placeholder="Deskripsikan pengalaman kerja Anda..."
            />
          ) : (
            <p className="text-muted leading-relaxed whitespace-pre-line">
              {portfolioUser.workExperience || "Belum ada pengalaman kerja yang ditambahkan."}
            </p>
          )}
        </Card>

        {/* Skills */}
        <Card padding="lg">
          <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary-400" />
            Keahlian
          </h2>
          {isEditing ? (
            <textarea
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              className="w-full px-4 py-3 bg-dark-800/30 border border-dark-600 rounded-xl text-dark-900 dark:text-white resize-none focus:outline-none focus:border-primary-500"
              rows={3}
              placeholder="Contoh: JavaScript, React, Node.js, Python"
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {portfolioUser.skills ? (
                portfolioUser.skills.split(',').map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-500/20 border border-primary-500/30 text-primary-300 rounded-full text-sm"
                  >
                    {skill.trim()}
                  </span>
                ))
              ) : (
                <p className="text-muted">Belum ada keahlian yang ditambahkan.</p>
              )}
            </div>
          )}
        </Card>

        {/* Social Media Links */}
        <Card padding="lg">
          <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-4 flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-primary-400" />
            Social Media & Links
          </h2>

          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  <Instagram className="h-4 w-4 inline mr-1" />
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={formData.instagramUrl}
                  onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800/30 border border-dark-600 rounded-xl text-dark-900 dark:text-white focus:outline-none focus:border-primary-500"
                  placeholder="https://instagram.com/username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  <Github className="h-4 w-4 inline mr-1" />
                  GitHub URL
                </label>
                <input
                  type="url"
                  value={formData.githubUrl}
                  onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800/30 border border-dark-600 rounded-xl text-dark-900 dark:text-white focus:outline-none focus:border-primary-500"
                  placeholder="https://github.com/username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  <Linkedin className="h-4 w-4 inline mr-1" />
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={formData.linkedinUrl}
                  onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800/30 border border-dark-600 rounded-xl text-dark-900 dark:text-white focus:outline-none focus:border-primary-500"
                  placeholder="https://linkedin.com/in/username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted mb-2">
                  <Globe className="h-4 w-4 inline mr-1" />
                  Website Pribadi
                </label>
                <input
                  type="url"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-800/30 border border-dark-600 rounded-xl text-dark-900 dark:text-white focus:outline-none focus:border-primary-500"
                  placeholder="https://website-anda.com"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SocialLink url={portfolioUser.instagramUrl} icon={Instagram} label="Instagram" />
              <SocialLink url={portfolioUser.githubUrl} icon={Github} label="GitHub" />
              <SocialLink url={portfolioUser.linkedinUrl} icon={Linkedin} label="LinkedIn" />
              <SocialLink url={portfolioUser.websiteUrl} icon={Globe} label="Website" />
              {!portfolioUser.instagramUrl && !portfolioUser.githubUrl && !portfolioUser.linkedinUrl && !portfolioUser.websiteUrl && (
                <p className="text-muted col-span-full">Belum ada social media yang ditambahkan.</p>
              )}
            </div>
          )}
        </Card>
      </div>
    </ActionFeedback>
  );
}