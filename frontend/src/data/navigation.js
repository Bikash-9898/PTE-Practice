import {
  FiHome,
  FiBookOpen,
  FiClipboard,
  FiBarChart2,
  FiClock,
  FiBookmark,
  FiUser,
  FiSettings,
  FiUsers,
  FiFileText,
  FiAward,
  FiGrid,
  FiMic,
  FiEdit3,
  FiBook,
  FiHeadphones,
} from "react-icons/fi";

export const publicNav = [
  { label: "Home", path: "/" },
  { label: "Practice", path: "/practice" },
  { label: "Mock Tests", path: "/mock-tests" },
  { label: "About", path: "/about" },
  { label: "Contact", path: "/contact" },
];

export const studentNav = [
  { label: "Dashboard", path: "/dashboard", icon: FiHome },
  { label: "My Progress", path: "/dashboard/progress", icon: FiBarChart2 },
  { label: "Test History", path: "/dashboard/history", icon: FiClock },
  { label: "Saved Questions", path: "/dashboard/saved", icon: FiBookmark },
  { label: "Practice", path: "/practice", icon: FiBookOpen },
  { label: "Mock Tests", path: "/mock-tests", icon: FiClipboard },
  { label: "Profile", path: "/dashboard/profile", icon: FiUser },
  { label: "Settings", path: "/dashboard/settings", icon: FiSettings },
];

export const adminNav = [
  { label: "Dashboard", path: "/admin", icon: FiGrid },
  { label: "Students", path: "/admin/students", icon: FiUsers },
  { label: "Questions", path: "/admin/questions", icon: FiFileText },
  { label: "Mock Tests", path: "/admin/mock-tests", icon: FiClipboard },
  { label: "Results", path: "/admin/results", icon: FiAward },
];

export const skillIcons = {
  speaking: FiMic,
  writing: FiEdit3,
  reading: FiBook,
  listening: FiHeadphones,
};

export const dashboardStats = {
  weeklyPractice: [
    { day: "Mon", minutes: 45 },
    { day: "Tue", minutes: 30 },
    { day: "Wed", minutes: 60 },
    { day: "Thu", minutes: 25 },
    { day: "Fri", minutes: 50 },
    { day: "Sat", minutes: 80 },
    { day: "Sun", minutes: 40 },
  ],
  skillProgress: [
    { skill: "Speaking", score: 72 },
    { skill: "Writing", score: 68 },
    { skill: "Reading", score: 81 },
    { skill: "Listening", score: 75 },
  ],
  recentTests: [
    { id: 1, name: "Full Practice Test A", date: "2026-03-10", score: 74, total: 90 },
    { id: 2, name: "Speaking Focus Test", date: "2026-03-08", score: 78, total: 90 },
    { id: 3, name: "Quick Skills Check", date: "2026-03-05", score: 70, total: 90 },
    { id: 4, name: "Listening Intensive", date: "2026-03-01", score: 65, total: 90 },
  ],
  continuePractice: [
    { skill: "speaking", type: "Read Aloud", progress: 60 },
    { skill: "writing", type: "Write Essay", progress: 30 },
    { skill: "reading", type: "Reorder Paragraphs", progress: 45 },
  ],
  recommended: [
    { id: "sp-ra-1", skill: "speaking", type: "Read Aloud", title: "Climate change passage" },
    { id: "wr-we-1", skill: "writing", type: "Write Essay", title: "Online education essay" },
    { id: "rd-mc-1", skill: "reading", type: "Multiple Choice", title: "Remote work passage" },
    { id: "ls-wfd-1", skill: "listening", type: "Write from Dictation", title: "Reception desk dictation" },
  ],
};

export const adminMockStudents = [
  { id: "s1", name: "Alex Johnson", email: "student@ptemaster.com", joined: "2025-06-15", practices: 48, avgScore: 74, status: "active" },
  { id: "s2", name: "Maria Garcia", email: "maria.g@email.com", joined: "2025-08-20", practices: 112, avgScore: 82, status: "active" },
  { id: "s3", name: "James Chen", email: "j.chen@email.com", joined: "2025-09-01", practices: 35, avgScore: 68, status: "active" },
  { id: "s4", name: "Priya Patel", email: "priya.p@email.com", joined: "2025-10-12", practices: 89, avgScore: 79, status: "active" },
  { id: "s5", name: "Omar Hassan", email: "omar.h@email.com", joined: "2025-11-05", practices: 12, avgScore: 55, status: "inactive" },
  { id: "s6", name: "Sophie Martin", email: "s.martin@email.com", joined: "2026-01-18", practices: 67, avgScore: 77, status: "active" },
  { id: "s7", name: "Liam O'Brien", email: "liam.ob@email.com", joined: "2026-02-02", practices: 23, avgScore: 71, status: "active" },
  { id: "s8", name: "Yuki Tanaka", email: "yuki.t@email.com", joined: "2026-02-20", practices: 41, avgScore: 85, status: "active" },
];

export const adminMockResults = [
  { id: "r1", student: "Alex Johnson", test: "Full Practice Test A", score: 74, date: "2026-03-10", status: "completed" },
  { id: "r2", student: "Maria Garcia", test: "Full Practice Test B", score: 88, date: "2026-03-09", status: "completed" },
  { id: "r3", student: "James Chen", test: "Speaking Focus Test", score: 62, date: "2026-03-08", status: "completed" },
  { id: "r4", student: "Priya Patel", test: "Quick Skills Check", score: 81, date: "2026-03-07", status: "completed" },
  { id: "r5", student: "Sophie Martin", test: "Listening Intensive", score: 70, date: "2026-03-06", status: "completed" },
  { id: "r6", student: "Yuki Tanaka", test: "Full Practice Test A", score: 90, date: "2026-03-05", status: "completed" },
  { id: "r7", student: "Liam O'Brien", test: "Reading & Writing Combo", score: 73, date: "2026-03-04", status: "completed" },
  { id: "r8", student: "Omar Hassan", test: "Quick Skills Check", score: 48, date: "2026-03-03", status: "completed" },
];

export const testimonials = [
  {
    id: 1,
    name: "Illustrative Student A",
    role: "Sample testimonial",
    text: "The free practice questions and progress tracking helped me structure my study routine across all four skills.",
    rating: 5,
    note: "Illustrative example — not a real student review",
  },
  {
    id: 2,
    name: "Illustrative Student B",
    role: "Sample testimonial",
    text: "Mock tests with timers made me more comfortable with exam pacing before test day.",
    rating: 5,
    note: "Illustrative example — not a real student review",
  },
  {
    id: 3,
    name: "Illustrative Student C",
    role: "Sample testimonial",
    text: "I liked being able to save drafts for writing tasks and review explanations after reading practice.",
    rating: 4,
    note: "Illustrative example — not a real student review",
  },
];
