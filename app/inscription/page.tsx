import { Suspense } from "react";
import PhoneFrame from "@/components/PhoneFrame";
import InscriptionForm from "@/components/auth/InscriptionForm";

export default function InscriptionPage() {
  return (
    <PhoneFrame>
      <Suspense fallback={null}>
        <InscriptionForm />
      </Suspense>
    </PhoneFrame>
  );
}
