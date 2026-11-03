export const config = {
  matcher: ['/server-data/:path*', '/lib/:path*', '/api/_data/:path*'],
};

export default function middleware() {
  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
