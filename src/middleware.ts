import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Rutas públicas (no requieren autenticación)
  const publicRoutes = ["/login", "/register"];
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);

  // Rutas de API de auth
  const isAuthApiRoute = nextUrl.pathname.startsWith("/api/auth");

  // Si es una ruta de API de auth, permitir siempre
  if (isAuthApiRoute) {
    return NextResponse.next();
  }

  // Si no está logueado y no es ruta pública, redirigir a login
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Si está logueado y trata de ir a login/register, redirigir a home
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)"],
};
