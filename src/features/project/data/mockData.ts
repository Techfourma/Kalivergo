export const mockUser = {
  name: "Jundi Lesmana",
  email: "jundi@kalivergo.id",
  role: "PRESIDENT",
  isVerified: true,
};

export const mockTasks = [
  {
    id: "1",
    title: "Tugas Algoritma - Sorting",
    description: "Implementasi Bubble Sort dan Quick Sort",
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    submissions: [],
  },
  {
    id: "2",
    title: "Laporan Praktikum Database",
    description: "Laporan praktikum minggu ke-8",
    deadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    submissions: [],
  },
  {
    id: "3",
    title: "Tugas Pemrograman Web",
    description: "Buat aplikasi CRUD dengan Next.js",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    submissions: [],
  },
];

export const mockTransactions = [
  { id: "1", type: "INCOME", amount: 500000, description: "Kas Januari", date: "2024-01-10T00:00:00.000Z" },
  { id: "2", type: "EXPENSE", amount: 150000, description: "Beli Spidol & Penghapus", date: "2024-01-15T00:00:00.000Z" },
  { id: "3", type: "INCOME", amount: 500000, description: "Kas Februari", date: "2024-02-10T00:00:00.000Z" },
  { id: "4", type: "EXPENSE", amount: 200000, description: "Konsumsi Rapat", date: "2024-02-20T00:00:00.000Z" },
];

export const mockMembers = [
  { userId: "1", userName: "Budi Santoso", userEmail: "budi@kalivergo.id", totalPaid: 400000, totalExpected: 500000, arrears: 100000, unpaidMonths: ["Maret"] },
  { userId: "2", userName: "Siti Aminah", userEmail: "siti@kalivergo.id", totalPaid: 500000, totalExpected: 500000, arrears: 0, unpaidMonths: [] },
  { userId: "3", userName: "Andi Pratama", userEmail: "andi@kalivergo.id", totalPaid: 300000, totalExpected: 500000, arrears: 200000, unpaidMonths: ["Februari", "Maret"] },
];

export const mockOrgMembers = [
  { id: "1", name: "Jundi Lesmana", email: "jundi@kalivergo.id", role: "PRESIDENT", image: null },
  { id: "2", name: "Wakil Ketua", email: "wakil@kalivergo.id", role: "VICE_PRESIDENT", image: null },
  { id: "3", name: "Sekretaris", email: "sekretaris@kalivergo.id", role: "SECRETARY", image: null },
  { id: "4", name: "Bendahara", email: "bendahara@kalivergo.id", role: "TREASURER", image: null },
  { id: "5", name: "Wakil Bendahara", email: "wakilbendahara@kalivergo.id", role: "VICE_TREASURER", image: null },

  ...Array.from({ length: 30 }, (_, i) => ({
    id: String(i + 6),
    name: `Anggota ${i + 1}`,
    email: `anggota${i + 1}@kalivergo.id`,
    role: "MEMBER",
    image: null,
  })),
];

export const mockProjects = [
  {
    id: "1",
    title: "E-Commerce Platform",
    description: "Platform e-commerce dengan fitur lengkap dan payment gateway.",
    techStack: ["Next.js", "TypeScript", "PostgreSQL"],
    imageUrl: null,
    githubUrl: "https://github.com",
    liveUrl: "https://example.com",
    memberName: "Jundi Lesmana",
    memberRole: "PRESIDENT",
  },
  {
    id: "2",
    title: "AI Chatbot Kelas",
    description: "Chatbot berbasis machine learning untuk tanya jawab tugas.",
    techStack: ["Python", "TensorFlow", "FastAPI"],
    imageUrl: null,
    githubUrl: "https://github.com",
    liveUrl: null,
    memberName: "Anggota 1",
    memberRole: "MEMBER",
  },
  {
    id: "3",
    title: "Aplikasi Absensi QR",
    description: "Sistem absensi menggunakan QR Code dan real-time database.",
    techStack: ["React Native", "Node.js", "MongoDB"],
    imageUrl: null,
    githubUrl: "https://github.com",
    liveUrl: null,
    memberName: "Anggota 2",
    memberRole: "MEMBER",
  },
];