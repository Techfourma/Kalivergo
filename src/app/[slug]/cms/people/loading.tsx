import Loading from '@/components/layout/Loading';

export default function PeopleLoading() {
  return (
    <Loading
      isVisible
      message="Memuat People Management"
      subMessage="Silakan tunggu sebentar..."
    />
  );
}