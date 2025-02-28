"use client"
"use client";
import Head from 'next/head';
import Appbar from './Appbar';

const About = () => {
  return (
    <>
     

      {/* Gradient Background Layers */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent opacity-20 animate-pulse-slow" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-purple-900/10 to-transparent opacity-30" />
        <div className="absolute inset-0 bg-[conic-gradient(at_top_left,var(--tw-gradient-stops))] from-purple-300/5 via-transparent to-transparent animate-[rotate_120s_linear_infinite]" />
      </div>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900  px-4 sm:px-6 lg:px-8">
        <div className='py-8'>
            <Appbar></Appbar>
        </div>
        <div className="max-w-4xl mx-auto backdrop-blur-lg bg-white/5 rounded-3xl p-8 shadow-2xl border border-white/10 relative overflow-hidden">
          
          {/* Floating particles */}
          <div className="absolute inset-0 -z-10">
            {[...Array(20)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-1 h-1 bg-purple-400/30 rounded-full animate-float"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.5}s`
                }}
              />
            ))}
          </div>

          <h1 className="text-6xl font-bold text-center mb-2 animate-fade-in bg-gradient-to-r from-blue-400 to-purple-300 bg-clip-text text-transparent">
            About VibeVault
          </h1>

          {/* Content sections */}
          <div className="space-y-4 relative">
            <Section
              emoji="🎵"
              title="Collaborate"
              color="blue"
              content="Share your favorite tracks and discover new gems with our community of passionate music enthusiasts."
            />

            <Section
              emoji="🗳️"
              title="Vote & Decide"
              color="purple"
              content="Shape the soundtrack of the moment through our democratic voting system. Every vote counts!"
            />

            <Section
              emoji="🎧"
              title="Sync & Stream"
              color="pink"
              content="Experience perfectly synchronized playback that keeps everyone in the groove, no matter their location."
            />
          </div>

          <footer className="mt-16 border-t border-white/10 pt-8 text-center">
            <p className="text-lg text-gray-400 hover:text-purple-300 transition-colors">
              Crafted with <span className="text-pink-400 animate-pulse">♥</span> by Gautam Prajapat
            </p>
          </footer>
        </div>
      </div>
    </>
  );
};

const Section = ({ emoji, title, color, content }: { emoji: string; title: string; color: "blue" | "purple" | "pink"; content: string }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-500/20',
      hoverBg: 'bg-blue-500/30',
      text: 'text-blue-300',
      border: 'border-blue-500/20',
      gradient: 'from-blue-500/20'
    },
    purple: {
      bg: 'bg-purple-500/20',
      hoverBg: 'bg-purple-500/30',
      text: 'text-purple-300',
      border: 'border-purple-500/20',
      gradient: 'from-purple-500/20'
    },
    pink: {
      bg: 'bg-pink-500/20',
      hoverBg: 'bg-pink-500/30',
      text: 'text-pink-300',
      border: 'border-pink-500/20',
      gradient: 'from-pink-500/20'
    }
  };

  return (
    <div className={`group relative p-6 rounded-2xl transition-all hover:bg-${color}-500/5 border border-transparent hover:border-${color}-500/20`}>
      <div className="flex items-start gap-6">
        <div className={`${colorClasses[color].bg} p-4 rounded-xl group-hover:${colorClasses[color].hoverBg} transition-colors`}>
          <span className="text-3xl">{emoji}</span>
        </div>
        <div>
          <h3 className={`text-2xl font-bold ${colorClasses[color].text} mb-3`}>{title}</h3>
          <p className="text-lg text-gray-300 leading-relaxed">{content}</p>
        </div>
      </div>
      <div className={`absolute inset-0 -z-10 opacity-0 group-hover:opacity-10 bg-gradient-to-r ${colorClasses[color].gradient} to-transparent transition-opacity`} />
    </div>
  );
};

export default About;