import { Contributors } from '@/components/sections/contributors';
import { CrisisBanner } from '@/components/sections/crisis-banner';
import { Dedication } from '@/components/sections/dedication';
import { Footer } from '@/components/sections/footer';
import { Hero } from '@/components/sections/hero';
import { HowToHelp } from '@/components/sections/how-to-help';
import { Mission } from '@/components/sections/mission';
import { Nav } from '@/components/sections/nav';
import { Problem } from '@/components/sections/problem';
import { Resources } from '@/components/sections/resources';
import { Roadmap } from '@/components/sections/roadmap';
import { Support } from '@/components/sections/support';
import { Tracks } from '@/components/sections/tracks';
import { WarningSigns } from '@/components/sections/warning-signs';

export function App() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <CrisisBanner />
      <Nav />
      <main id="main" className="min-h-screen">
        <Hero />
        <Dedication />
        <Mission />
        <Problem />
        <WarningSigns />
        <HowToHelp />
        <Resources />
        <Roadmap />
        <Tracks />
        <Support />
        <Contributors />
        <Footer />
      </main>
    </>
  );
}
