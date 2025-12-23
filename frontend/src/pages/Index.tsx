import Logo from "@/components/Logo";
import WalletConnect from "@/components/WalletConnect";
import HabitMoodLogger from "@/components/HabitMoodLogger";
import HabitMoodViewer from "@/components/HabitMoodViewer";
import HabitMoodAnalysis from "@/components/HabitMoodAnalysis";
import { Heart, Lock, TrendingUp, Sparkles, Shield, BarChart3, Plus, Eye, BarChart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const Index = () => {
  const [activeTab, setActiveTab] = useState<'logger' | 'viewer' | 'analysis'>('logger');
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  const featureVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-background geometric-bg relative overflow-hidden">
      {/* Enhanced Header with Glass Effect */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Logo />
          </motion.div>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <WalletConnect />
          </motion.div>
        </div>
      </motion.header>

      <main className="pt-24 pb-16">
        {/* Hero Section with Split Layout */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto px-4 mb-16 relative"
        >
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-7xl mx-auto">
            {/* Left Column - Content */}
            <motion.div
              variants={itemVariants}
              className="relative z-10"
            >
              <motion.h1
                className="text-4xl md:text-6xl font-bold mb-6 text-gradient-animated"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Encrypted
                <br />
                <span className="text-3xl md:text-5xl bg-gradient-to-r from-accent via-primary to-secondary bg-clip-text text-transparent">
                  Habit-Mood Tracker
                </span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-xl text-muted-foreground mb-4"
              >
                Track your habits and emotions with complete privacy
              </motion.p>

              <motion.p
                variants={itemVariants}
                className="text-base text-muted-foreground mb-8 leading-relaxed"
              >
                Analyze correlations between habits and mood improvements using fully homomorphic encryption.
                Your data remains encrypted even during analysis.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-wrap gap-3"
              >
                <motion.div
                  className="flex items-center gap-2 px-4 py-2 bg-card/50 rounded-lg border border-border/50"
                  whileHover={{ scale: 1.05 }}
                >
                  <Lock className="w-4 h-4 text-primary" />
                  <span className="text-sm">End-to-End Encrypted</span>
                </motion.div>
                <motion.div
                  className="flex items-center gap-2 px-4 py-2 bg-card/50 rounded-lg border border-border/50"
                  whileHover={{ scale: 1.05 }}
                >
                  <Heart className="w-4 h-4 text-accent" />
                  <span className="text-sm">Privacy First</span>
                </motion.div>
                <motion.div
                  className="flex items-center gap-2 px-4 py-2 bg-card/50 rounded-lg border border-border/50"
                  whileHover={{ scale: 1.05 }}
                >
                  <TrendingUp className="w-4 h-4 text-secondary" />
                  <span className="text-sm">Smart Analytics</span>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Right Column - Visual/Stats */}
            <motion.div
              variants={itemVariants}
              className="relative"
            >
              <div className="card-premium p-8 rounded-2xl">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary mb-2">0</div>
                    <div className="text-sm text-muted-foreground">Total Records</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-accent mb-2">0</div>
                    <div className="text-sm text-muted-foreground">Days Tracked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-secondary mb-2">0</div>
                    <div className="text-sm text-muted-foreground">Avg Mood</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">0%</div>
                    <div className="text-sm text-muted-foreground">Habit Rate</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>

        {/* Features Grid with Enhanced Cards - Layered Depth */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto px-4 mb-16 relative perspective-container"
        >
          <motion.div
            className="grid md:grid-cols-3 gap-8 relative"
            variants={containerVariants}
          >
            {/* Layer 1 - Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 rounded-3xl -z-10" />
            
            {/* Layer 2 - Feature Cards with 3D depth */}
            <motion.div
              variants={featureVariants}
              whileHover={{ y: -16, rotateY: 5, z: 30 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative group layer-2"
            >
              <div className="absolute -inset-1 bg-gradient-to-br from-blue-500/30 to-cyan-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
              <div className="relative card-premium h-full p-8 rounded-2xl card-hover shadow-depth-3 card-3d">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-transparent rounded-t-2xl" />
                <motion.div
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 glow-pulse shadow-depth-2"
                  whileHover={{ rotate: 360, scale: 1.15 }}
                  transition={{ duration: 0.6 }}
                >
                  <Shield className="w-8 h-8 text-white drop-shadow-lg" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-4 text-gradient-animated">End-to-End Encryption</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  All your mood and habit data is encrypted on-chain using FHEVM. Only you can decrypt and view your personal insights.
                </p>
                <div className="absolute top-4 right-4 w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50" />
                <div className="absolute bottom-4 left-4 w-20 h-20 bg-blue-500/5 rounded-full" />
              </div>
            </motion.div>

            <motion.div
              variants={featureVariants}
              whileHover={{ y: -16, rotateY: -5, z: 30 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
              className="relative group layer-3"
            >
              <div className="absolute -inset-1 bg-gradient-to-br from-pink-500/30 to-rose-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
              <div className="relative card-premium h-full p-8 rounded-2xl card-hover shadow-depth-4 card-3d">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-transparent rounded-t-2xl" />
                <motion.div
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 glow-pulse shadow-depth-2"
                  whileHover={{ rotate: 360, scale: 1.15 }}
                  transition={{ duration: 0.6 }}
                  style={{ animationDelay: '0.5s' }}
                >
                  <Heart className="w-8 h-8 text-white drop-shadow-lg" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-4 text-gradient-animated">Mood & Habit Tracking</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Record your daily mood levels and habit completion rates with intuitive, emoji-based interfaces.
                </p>
                <div className="absolute top-4 right-4 w-3 h-3 bg-pink-400 rounded-full animate-pulse shadow-lg shadow-pink-400/50" style={{ animationDelay: '0.5s' }} />
                <div className="absolute bottom-4 left-4 w-20 h-20 bg-pink-500/5 rounded-full" />
              </div>
            </motion.div>

            <motion.div
              variants={featureVariants}
              whileHover={{ y: -16, rotateY: 5, z: 30 }}
              transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
              className="relative group layer-2"
            >
              <div className="absolute -inset-1 bg-gradient-to-br from-green-500/30 to-emerald-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
              <div className="relative card-premium h-full p-8 rounded-2xl card-hover shadow-depth-3 card-3d">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-transparent rounded-t-2xl" />
                <motion.div
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 glow-pulse shadow-depth-2"
                  whileHover={{ rotate: 360, scale: 1.15 }}
                  transition={{ duration: 0.6 }}
                  style={{ animationDelay: '1s' }}
                >
                  <BarChart3 className="w-8 h-8 text-white drop-shadow-lg" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-4 text-gradient-animated">Smart Analytics</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  Discover correlations between your habits and mood with AI-powered insights and beautiful data visualizations.
                </p>
                <div className="absolute top-4 right-4 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-4 left-4 w-20 h-20 bg-green-500/5 rounded-full" />
              </div>
            </motion.div>
          </motion.div>

          {/* Additional decorative elements */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
            <motion.div
              className="w-32 h-32 border border-primary/20 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute top-4 left-4 w-24 h-24 border border-accent/20 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute bottom-2 right-2 w-16 h-16 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.section>

        {/* Tab Navigation */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="container mx-auto px-4 mb-8"
        >
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            <motion.button
              onClick={() => setActiveTab('logger')}
              className={`relative px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'logger'
                  ? 'bg-primary/20 text-primary border-2 border-primary/50'
                  : 'bg-card/50 text-muted-foreground border-2 border-transparent hover:border-border/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                <span>Log Record</span>
              </div>
              {activeTab === 'logger' && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                  layoutId="activeTab"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>

            <motion.button
              onClick={() => setActiveTab('viewer')}
              className={`relative px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'viewer'
                  ? 'bg-purple-500/20 text-purple-400 border-2 border-purple-500/50'
                  : 'bg-card/50 text-muted-foreground border-2 border-transparent hover:border-border/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <span>View Records</span>
              </div>
              {activeTab === 'viewer' && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-400 rounded-full"
                  layoutId="activeTab"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>

            <motion.button
              onClick={() => setActiveTab('analysis')}
              className={`relative px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === 'analysis'
                  ? 'bg-green-500/20 text-green-400 border-2 border-green-500/50'
                  : 'bg-card/50 text-muted-foreground border-2 border-transparent hover:border-border/50'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex items-center gap-2">
                <BarChart className="w-5 h-5" />
                <span>Analysis</span>
              </div>
              {activeTab === 'analysis' && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-400 rounded-full"
                  layoutId="activeTab"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {activeTab === 'logger' && <HabitMoodLogger />}
              {activeTab === 'viewer' && <HabitMoodViewer />}
              {activeTab === 'analysis' && <HabitMoodAnalysis />}
            </motion.div>
          </AnimatePresence>
        </motion.section>
      </main>

      {/* Floating Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Large gradient orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-20 h-20 bg-gradient-to-br from-primary/15 to-blue-500/10 rounded-full"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-accent/15 to-pink-500/10 rounded-full"
          animate={{
            x: [0, -40, 0],
            y: [0, 30, 0],
            scale: [1, 0.9, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Geometric shapes */}
        <div className="floating-shapes">
          <div className="shape-1 morphing-shape" />
          <div className="shape-2 morphing-shape" />
          <div className="shape-3 morphing-shape" />
          <div className="shape-4 morphing-shape" />
          <div className="shape-5 morphing-shape" />
        </div>

        {/* Additional floating elements */}
        <motion.div
          className="absolute top-1/3 right-1/3 w-16 h-16 bg-gradient-to-br from-purple-500/8 to-indigo-500/8 rounded-full"
          animate={{
            x: [0, -25, 0],
            y: [0, 15, 0],
            rotate: [0, 90, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <motion.div
          className="absolute bottom-1/3 left-1/3 w-20 h-20 bg-gradient-to-br from-teal-500/6 to-cyan-500/6 rounded-full"
          animate={{
            x: [0, 35, 0],
            y: [0, -25, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Particle-like dots */}
        <div className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Index;

