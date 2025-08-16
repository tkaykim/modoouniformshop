import { SiteHeader } from "@/components/SiteHeader";
import CompleteClient from "./CompleteClient";

export default function OrderCompletePage({ searchParams }: { searchParams: { orderNo?: string } }) {
  const orderNo = searchParams?.orderNo || '';
  return (
    <div className="min-h-screen bg-gray-50">
      <SiteHeader />
      <CompleteClient orderNo={orderNo} />
    </div>
  );
}


