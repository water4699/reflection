const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-300">
        <span className="text-xl font-bold text-white animate-pulse">RL</span>
      </div>
      <span className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent hover:scale-105 transition-transform duration-300">
        Reflection Log
      </span>
    </div>
  );
};

export default Logo;

