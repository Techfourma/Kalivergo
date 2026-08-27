import Loading from "@/components/layout/Loading";


export default function HomeLoading() {
  return (
    <Loading
      isVisible
      message="Memuat Halaman Project"
      subMessage="Silakan tunggu sebentar..."
    />
  );
}