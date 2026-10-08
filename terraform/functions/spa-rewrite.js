// CloudFront Function (viewer-request) attached ONLY to the frontend (S3) behavior.
// SPA routes such as /products/:id or /cart/shared don't exist as objects in S3, so they are
// rewritten to /index.html. Requests for real files (anything whose last segment has an
// extension: .js, .css, .png, ...) pass through untouched.
//
// This replaces distribution-wide custom_error_response 403/404 -> /index.html, which also
// rewrote API errors under /api/v1/* into a 200 HTML page.
function handler(event) {
  var request = event.request;
  var lastSegment = request.uri.split('/').pop();

  if (lastSegment.indexOf('.') === -1) {
    request.uri = '/index.html';
  }

  return request;
}
