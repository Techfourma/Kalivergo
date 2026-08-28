import Loading from "@/components/layout/Loading";

export default function InformationLoading() {
  return (
    <Loading
      isVisible
      message="Memuat Halaman Information"
      subMessage="Silakan tunggu sebentar..."
    />
  );
}
