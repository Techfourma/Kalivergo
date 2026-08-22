import Loading from '@/components/layout/Loading';

export default function TasksLoading() {
  return (
    <Loading
      isVisible
      message="Memuat CMS Overview"
      subMessage="Silakan tunggu sebentar..."
    />
  );
}