// // app/t/[id]/page.tsx
// "use client";

// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import AppShell from "../../components/AppShell";
// import TicketDetails, {
//   TicketDetailsModel,
//   TipsterMini,
// } from "../../components/TicketDetails";

// export default function TicketPage({ params }: { params: { id: string } }) {
//   const router = useRouter();
//   const id = params.id;

//   const [loading, setLoading] = useState(true);
//   const [ticket, setTicket] = useState<TicketDetailsModel | null>(null);
//   const [tipster, setTipster] = useState<TipsterMini>(null);
//   const [err, setErr] = useState<string | null>(null);

//   useEffect(() => {
//     const load = async () => {
//       setLoading(true);
//       setErr(null);
//       try {
//         const res = await fetch(`/api/tickets/${encodeURIComponent(id)}`);
//         if (!res.ok) {
//           const msg =
//             (await res.json().catch(() => null))?.message ?? "Failed to load";
//           setErr(msg);
//           return;
//         }
//         const json = await res.json();
//         if (json?.ok) {
//           setTicket(json.ticket as TicketDetailsModel);
//           setTipster(json.tipster as TipsterMini);
//         } else {
//           setErr(json?.message ?? "Failed to load");
//         }
//       } catch (e) {
//         setErr(e instanceof Error ? e.message : "Failed to load");
//       } finally {
//         setLoading(false);
//       }
//     };
//     load();
//   }, [id]);

//   return (
//     <AppShell title="Ticket" showPostButton={false}>
//       {loading && <div className="text-white/70">Loading…</div>}
//       {!loading && err && <div className="text-red-300 text-sm">{err}</div>}
//       {!loading && !err && ticket && (
//         <TicketDetails
//           ticket={ticket}
//           tipster={tipster}
//           onBuy={() => router.push(`/purchase/${ticket.id}`)} // placeholder route
//         />
//       )}
//     </AppShell>
//   );
// }
