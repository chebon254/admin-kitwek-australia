import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const publicRoutes = createRouteMatcher(['/api/webhook']);

export default clerkMiddleware(async (auth, request) => {
  const url = new URL(request.url);

  if (!publicRoutes(request)) {
    const { userId } = await auth();

    if (!userId && !url.pathname.startsWith("/sign-in")) {
      return Response.redirect(new URL("/sign-in", request.url));
    }
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};