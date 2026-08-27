import Loading from "@/components/layout/Loading";


export default function HomeLoading() {
  return (
    <Loading
      isVisible
      message="Memuat Halaman Portofolio"
      subMessage="Silakan tunggu sebentar..."
    />
  );
}