import Logo from "@/components/Logo";
import WalletConnect from "@/components/WalletConnect";
import HabitMoodLogger from "@/components/HabitMoodLogger";
import HabitMoodViewer from "@/components/HabitMoodViewer";
import HabitMoodAnalysis from "@/components/HabitMoodAnalysis";
import { Heart, Lock, TrendingUp } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo />
          <WalletConnect />
        </div>
      </header>
      
      <main className="pt-24 pb-16">
        <section className="container mx-auto px-4 mb-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Encrypted Habit-Mood Tracker
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4">
              Track your habits and emotions with complete privacy
            </p>
            <p className="text-base text-muted-foreground">
              Analyze correlations between habits and mood improvements using fully homomorphic encryption. 
              Your data remains encrypted even during analysis.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 mb-12">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 rounded-lg border bg-card">
              <Lock className="w-8 h-8 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">End-to-End Encryption</h3>
              <p className="text-muted-foreground">
                All your mood and habit data is encrypted on-chain. Only you can decrypt it.
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <Heart className="w-8 h-8 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Mood Tracking</h3>
              <p className="text-muted-foreground">
                Record your daily mood (1-5) and habit completion rate (0-100%) securely.
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <TrendingUp className="w-8 h-8 mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Encrypted Analysis</h3>
              <p className="text-muted-foreground">
                Discover correlations between habits and mood improvements without exposing data.
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 space-y-8">
          <HabitMoodLogger />
          <HabitMoodViewer />
          <HabitMoodAnalysis />
        </div>
      </main>
    </div>
  );
};

export default Index;

