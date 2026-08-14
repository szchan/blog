export function Footer() {
  return (
    <footer className="border-t border-border/50 px-6 py-8 text-center text-sm text-muted">
      <p>
        Built with Next.js, FastAPI, and Tailwind CSS. {" "}
        <span className="gradient-text font-semibold">© {new Date().getFullYear()}</span>
      </p>
    </footer>
  );
}
