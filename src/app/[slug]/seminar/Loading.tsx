import Loading from "@/components/layout/Loading";

export default function SeminarLoading() {
  return (
    <Loading
      isVisible
      message="Memuat Halaman Seminar"
      subMessage="Silakan tunggu sebentar..."
    />
  );
}