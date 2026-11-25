export function githubUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'github.com' &&
      !url.username && !url.password && !url.port &&
      /^\/[^/]+\/[^/]+/.test(url.pathname) ? url.href : '';
  } catch {
    return '';
  }
}
