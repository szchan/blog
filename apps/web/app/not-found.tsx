import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-6xl font-bold gradient-text">404</h1>
      <p className="text-lg text-muted">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-5 py-2.5 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-purple-500/25"
      >
        Go home
      </Link>
    </div>
  );
}
