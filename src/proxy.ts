import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/lib/auth/cookies";
import { countRedirectHit, findRedirect } from "@/lib/redirects";
import { findLegacyProductTarget } from "@/lib/legacy";

/**
 * Next 16 proxy (eski adıyla middleware), Node çalışma zamanı.
 * 1) /admin: oturum çerezi yoksa girişe yönlendirir. YALNIZCA kolaylıktır — asıl yetki kontrolü her sayfa ve
 *    server action'da requireAdmin() ile veritabanındaki oturuma karşı yapılır.
 * 2) Public yollar: Admin › SEO › Yönlendirmeler tablosundaki 301/302 kayıtları (tek adım, sorgu dizesi korunur).
 * 3) Eski Wix ürün URL'leri (/product-page/...): aynı adlı ürün varsa 301, yoksa aramaya 302.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (pathname !== "/admin/giris" && !request.cookies.has(ADMIN_SESSION_COOKIE)) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/giris";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  const entry = await findRedirect(pathname);
  if (entry) {
    void countRedirectHit(pathname); // rapor için isabet sayacı (yanıtı bekletmez)
    const target = new URL(entry.destinationPath, request.nextUrl.origin);
    if (!target.search && search) target.search = search;
    return NextResponse.redirect(target, entry.statusCode);
  }

  if (pathname.startsWith("/product-page/") || pathname.startsWith("/category/")) {
    const target = await findLegacyProductTarget(pathname);
    if (target) return NextResponse.redirect(new URL(target.path, request.nextUrl.origin), target.status);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|uploads|og/|feeds/|favicon.ico|icon.svg|apple-icon.png|brand/|sitemap.xml|robots.txt|llms.txt|manifest.webmanifest|api).*)"],
};
