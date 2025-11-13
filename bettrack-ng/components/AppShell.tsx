// // components/AppShell.tsx
// "use client";

// import { useState, ReactNode } from "react";
// import Sidebar from "./SkeletonCard";
// import Link from "next/link";

// export default function AppShell({
//   title,
//   children,
//   showPostButton = true,
// }: {
//   title?: string;
//   children: ReactNode;
//   showPostButton?: boolean;
// }) {
//   const [open, setOpen] = useState(false);

//   return (
//     <div className="min-h-screen bg-[#0b0f10] text-white">
//       {/* Top bar */}
//       <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0b0f10]/80 backdrop-blur">
//         <button
//           aria-label="Open menu"
//           onClick={() => setOpen(true)}
//           className="rounded-lg px-3 py-2 bg-white/5 hover:bg-white/10"
//         >
//           ☰
//         </button>
//         <div className="text-base font-semibold">{title ?? "BetTrack NG"}</div>
//         <div className="flex items-center gap-2">
//           {/* Notification placeholder (non-functional yet) */}
//           <button
//             aria-label="Notifications"
//             className="rounded-lg px-3 py-2 bg-white/5 hover:bg-white/10"
//             disabled
//             title="Notifications coming soon"
//           >
//             🔔
//           </button>
//         </div>
//       </header>

//       {/* Sidebar Drawer */}
//       <Sidebar open={open} onClose={() => setOpen(false)} />

//       {/* Content */}
//       <main className="mx-auto max-w-xl px-4 py-4">{children}</main>

//       {/* Bottom tabs */}
//       <nav className="fixed bottom-0 left-0 right-0 mx-auto max-w-xl border-t border-white/10 bg-[#0b0f10]/90 backdrop-blur">
//         <div className="grid grid-cols-4">
//           <Link href="/" className="py-3 text-center hover:bg-white/5">
//             Home
//           </Link>
//           <Link href="/browse" className="py-3 text-center hover:bg-white/5">
//             Browse
//           </Link>
//           <Link href="/tickets" className="py-3 text-center hover:bg-white/5">
//             Tickets
//           </Link>
//           <Link href="/profile" className="py-3 text-center hover:bg-white/5">
//             Profile
//           </Link>
//         </div>
//       </nav>

//       {/* Floating Post Ticket button (if shown) */}
//       {showPostButton && (
//         <Link
//           href="/tipster/new"
//           className="fixed right-4 bottom-20 rounded-full px-4 py-3 bg-fuchsia-600 hover:bg-fuchsia-500 font-medium shadow-lg"
//         >
//           + Post Ticket
//         </Link>
//       )}
//     </div>
//   );
// }
