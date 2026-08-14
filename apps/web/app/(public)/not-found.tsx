import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
      <h1 className="text-6xl font-bold gradient-text">404</h1>
      <p className="text-lg text-muted">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Button href="/">Go home</Button>
    </div>
  );
}
