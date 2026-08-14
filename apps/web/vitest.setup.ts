import "@testing-library/jest-dom/vitest";

const mockLocation = {
  href: "http://localhost/",
  origin: "http://localhost",
  protocol: "http:",
  host: "localhost",
  hostname: "localhost",
  port: "",
  pathname: "/",
  search: "",
  hash: "",
  assign: () => {},
  reload: () => {},
  replace: () => {},
  toString: () => "http://localhost/",
};

try {
  Object.defineProperty(window, "location", {
    value: mockLocation,
    writable: true,
    configurable: true,
  });
} catch {
  // jsdom may not allow redefining location; tests that spy on
  // window.location.href will need an alternative approach.
}
