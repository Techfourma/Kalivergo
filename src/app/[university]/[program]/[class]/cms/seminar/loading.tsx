import Loading from '@/components/layout/Loading';

export default function SeminarLoading() {
  return (
    <Loading
      isVisible
      message="Memuat Manage Seminar"
      subMessage="Silakan tunggu sebentar..."
    />
  );
}