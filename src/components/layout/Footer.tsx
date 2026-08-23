import { Github, Heart } from "lucide-react";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-dark-200 bg-dark-950 text-dark-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 shadow-lg overflow-hidden">
              <Image
                src="/logo.jpg"
                alt="kalivergo Logo"
                width={32}
                height={32}
                className="object-cover"
              />
            </div>
            <span className="text-sm font-medium text-dark-300">
              kalivergo © {new Date().getFullYear()}
            </span>
          </div>
          <p className="flex items-center gap-1 text-xs">
            Made with <Heart className="h-3 w-3 text-red-500 fill-red-500" /> by
            kalivergo Team
          </p>
        </div>
      </div>
    </footer>
  );
}