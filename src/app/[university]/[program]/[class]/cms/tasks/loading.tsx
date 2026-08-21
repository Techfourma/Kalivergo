import Loading from '@/components/layout/Loading';

export default function TasksLoading() {
  return (
    <Loading
      isVisible
      message="Memuat Manage Tasks"
      subMessage="Silakan tunggu sebentar..."
    />
  );
}