import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/findings/:path*",
    "/users/:path*",
    "/reports/:path*",
    "/timeline/:path*",
    "/copilot/:path*",
    "/sla/:path*",
    "/knowledge/:path*",
    "/my-findings/:path*",
    "/import/:path*",
  ],
};