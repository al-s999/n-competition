import { Suspense } from "react";
import CompetitionDetailClient from "./competition-client";
import Loading from "./loading";

export const metadata = {
  title: "Competition Details",
};

export default function CompetitionDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<Loading />}>
      <CompetitionDetailClient />
    </Suspense>
  );
}
