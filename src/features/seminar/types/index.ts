export interface Seminar {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  createdAt: Date;
  registrations?: SeminarRegistration[];
}

export interface SeminarRegistration {
  id: string;
  seminarId: string;
  userId: string;
  status: string;
  seminar?: Seminar;
  user?: User;
}

export interface User {
  id: string;
  name: string;
  email?: string | null;
}