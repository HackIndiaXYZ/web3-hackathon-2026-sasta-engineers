import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, Lock, Zap, Globe, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">ChainCred</span>
          </div>
          <nav className="hidden gap-6 md:flex">
            <Link href="#features" className="text-sm font-medium hover:text-primary">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary">
              How It Works
            </Link>
            <Link href="/verify" className="text-sm font-medium hover:text-primary">
              Verify
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-5xl font-bold tracking-tight md:text-6xl">
            Blockchain-Powered
            <span className="text-primary"> Credential Verification</span>
          </h1>
          <p className="mb-8 text-xl text-muted-foreground">
            Secure, transparent, and tamper-proof credential verification for educational
            institutions and students. Built on Polygon blockchain.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started Free
              </Button>
            </Link>
            <Link href="/verify">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Verify Credential
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-secondary/50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Why ChainCred?</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={<Lock className="h-10 w-10 text-primary" />}
              title="Tamper-Proof"
              description="Credentials stored on blockchain cannot be altered or forged, ensuring authenticity."
            />
            <FeatureCard
              icon={<Zap className="h-10 w-10 text-primary" />}
              title="Instant Verification"
              description="Verify credentials in seconds with QR codes or file uploads. No waiting required."
            />
            <FeatureCard
              icon={<Globe className="h-10 w-10 text-primary" />}
              title="Globally Accessible"
              description="Access and verify credentials from anywhere in the world, 24/7."
            />
            <FeatureCard
              icon={<CheckCircle className="h-10 w-10 text-primary" />}
              title="Trusted Issuers"
              description="Only verified institutions can issue credentials, maintaining platform integrity."
            />
            <FeatureCard
              icon={<Users className="h-10 w-10 text-primary" />}
              title="Multi-Role Support"
              description="Separate dashboards for students, issuers, verifiers, and administrators."
            />
            <FeatureCard
              icon={<Shield className="h-10 w-10 text-primary" />}
              title="Privacy First"
              description="Your data is encrypted and secure. You control who sees your credentials."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <StepCard
              number="1"
              title="Institution Issues"
              description="Verified institutions upload and issue credentials to students on the blockchain."
            />
            <StepCard
              number="2"
              title="Student Receives"
              description="Students receive their credentials with a unique QR code and downloadable certificate."
            />
            <StepCard
              number="3"
              title="Anyone Verifies"
              description="Employers or anyone can instantly verify credential authenticity using QR code or file."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ready to Get Started?</h2>
          <p className="mb-8 text-lg opacity-90">
            Join thousands of institutions and students using ChainCred
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 ChainCred. All rights reserved.</p>
          <p className="mt-2">Built on Polygon • Powered by Blockchain</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-4">{icon}</div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
        {number}
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}
