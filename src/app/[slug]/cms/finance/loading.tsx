import Loading from '@/components/layout/Loading';

export default function FinanceLoading() {
  return (
    <Loading
      isVisible
      message="Memuat Manage Finance"
      subMessage="Silakan tunggu sebentar..."
    />
  );
}