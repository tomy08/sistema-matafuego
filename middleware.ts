export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/((?!api/auth|api/tesseract|_next/static|_next/image|favicon.ico).*)"],
};
