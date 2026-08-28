import { LoaderCircle, Sparkles } from "lucide-react";

interface LoadingProps {
  isVisible?: boolean;
  message?: string;
  subMessage?: string;
}

export default function Loading({
  isVisible = true,
  message = "Memuat halaman",
  subMessage = "Harap tunggu sebentar...",
}: LoadingProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-dark-50/85 dark:bg-dark-950/85 px-4 backdrop-blur-xl">
      <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-dark-200 bg-white/90 dark:border-dark-800 dark:bg-dark-900/90 p-8 text-center shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(96,165,250,0.25),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.2),_transparent_35%)]" />
        <div className="relative z-10">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-dark-200 bg-dark-100/80 dark:border-white/20 dark:bg-white/10">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary-400" />
          </div>

          <div className="mb-4 flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-primary-300">
            <Sparkles className="h-4 w-4" />
            <span>kalivergo</span>
          </div>

         
          <h3 className="text-xl font-semibold text-dark-900 dark:text-white">{message}</h3>
          <p className="mt-2 text-sm text-dark-600 dark:text-dark-200">{subMessage}</p>

          <div className="mt-6 flex items-center justify-center gap-2">
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary-400 [animation-delay:-0.2s]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-accent-400 [animation-delay:-0.1s]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-cyan-400" />
          </div>
        </div>
      </div>
    </div>
  );
}