import Loading from '@/components/layout/Loading';

export default function TasksLoading() {
  return (
    <Loading
      isVisible
      message="Memuat Tasks"
      subMessage="Silakan tunggu sebentar..."
    />
  );
}