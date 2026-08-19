import Loading from "@/components/layout/Loading";

export default function DashboardLoading() {
  return (
    <Loading
      isVisible
      message="Memuat Dashboard"
      subMessage="Silakan tunggu sebentar..."
    />
  );
}