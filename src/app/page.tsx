import { AuthorityGrid } from "@/components/landing/AuthorityGrid";
import { CompareDesk } from "@/components/landing/CompareDesk";
import { DemandGap } from "@/components/landing/DemandGap";
import { DropSimulator } from "@/components/landing/DropSimulator";
import { FinalCta } from "@/components/landing/FinalCta";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Limits } from "@/components/landing/Limits";
import { LiveProof } from "@/components/landing/LiveProof";
import { LtvLadder } from "@/components/landing/LtvLadder";
import { Markets } from "@/components/landing/Markets";
import { Partners } from "@/components/landing/Partners";
import { ProofStrip } from "@/components/landing/ProofStrip";
import { Questions } from "@/components/landing/Questions";
import { Security } from "@/components/landing/Security";
import { LandingMusic } from "@/components/ui/LandingMusic";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { TrustStrip } from "@/components/ui/TrustStrip";

export default function Home() {
  return (
    <>
      <LandingMusic />
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Partners />
        <DemandGap />
        <ProofStrip />
        <LiveProof />
        <AuthorityGrid />
        <LtvLadder />
        <HowItWorks />
        <DropSimulator />
        <CompareDesk />
        <Markets />
        <Security />
        <Limits />
        <Questions />
        <TrustStrip />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
