import { SiteHeader } from "@/components/SiteHeader";
import CompleteClient from "./CompleteClient";

export default async function OrderCompletePage({ searchParams }: { searchParams: Promise<{ orderNo?: string }> }) {
  const sp = await searchParams;
  const orderNo = sp?.orderNo || '';
  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <CompleteClient orderNo={orderNo} />
    </div>
  );
}


