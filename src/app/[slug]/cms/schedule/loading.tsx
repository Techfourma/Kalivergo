import Loading from '@/components/layout/Loading';

export default function ScheduleLoading() {
  return (
    <Loading
      isVisible
      message="Memuat Manage Schedule"
      subMessage="Silakan tunggu sebentar..."
    />
  );
}