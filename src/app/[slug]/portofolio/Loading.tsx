import Loading from "@/components/layout/Loading";


export default function PortofolioLoading() {
  return (
    <Loading
      isVisible
      message="Memuat Halaman Portofolio"
      subMessage="Silakan tunggu sebentar..."
    />
  );
}