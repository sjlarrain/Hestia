import { Suspense } from "react";
import CasaApp from "@/components/casa/CasaApp";

export default function Home() {
  return (
    <Suspense fallback={null}>
      <CasaApp />
    </Suspense>
  );
}
