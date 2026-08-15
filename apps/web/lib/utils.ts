export function resolveImageUrl(url: string): string {
  return url.startsWith("http")
    ? url
    : `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}${url}`;
}
