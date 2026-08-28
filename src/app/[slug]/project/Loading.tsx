import Loading from "@/components/layout/Loading";


export default function ProjectLoading() {
  return (
    <Loading
      isVisible
      message="Memuat Halaman Project"
      subMessage="Silakan tunggu sebentar..."
    />
  );
}