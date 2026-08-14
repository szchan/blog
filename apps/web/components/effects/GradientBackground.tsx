export function GradientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-pink-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
    </div>
  );
}
