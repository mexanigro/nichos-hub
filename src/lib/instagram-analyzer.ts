/**
 * Best-effort Instagram profile analyzer.
 * Fetches public profile page and extracts bio + profile pic.
 * Falls back gracefully if blocked (Instagram frequently blocks server-side requests).
 */

export interface InstagramData {
  bio: string | null;
  profilePicUrl: string | null;
  followerHint: string | null;
}

/**
 * Analyze an Instagram handle by scraping the public profile page.
 * Returns null if the profile can't be reached or parsed.
 */
export async function analyzeInstagram(handle: string): Promise<InstagramData | null> {
  // Clean handle: remove @, spaces, URLs
  const clean = handle
    .trim()
    .replace(/^@/, "")
    .replace(/^https?:\/\/(www\.)?instagram\.com\//, "")
    .replace(/\/.*$/, "")
    .trim();

  if (!clean || clean.length < 2) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`https://www.instagram.com/${clean}/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!res.ok) return null;

    const html = await res.text();

    // Extract OG description (contains bio and follower count)
    const descMatch = html.match(/<meta\s+(?:property|name)="og:description"\s+content="([^"]*)"/) ||
                      html.match(/content="([^"]*)"\s+(?:property|name)="og:description"/);
    const bio = descMatch?.[1]?.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">") || null;

    // Extract OG image (profile picture)
    const imgMatch = html.match(/<meta\s+(?:property|name)="og:image"\s+content="([^"]*)"/) ||
                     html.match(/content="([^"]*)"\s+(?:property|name)="og:image"/);
    const profilePicUrl = imgMatch?.[1] || null;

    // Try to extract follower count hint from description
    // Instagram OG description format: "N Followers, N Following, N Posts - ..."
    let followerHint: string | null = null;
    if (bio) {
      const followerMatch = bio.match(/([\d,.]+[KMkm]?)\s*Followers/i);
      if (followerMatch) {
        followerHint = followerMatch[1];
      }
    }

    // If we got nothing useful, return null
    if (!bio && !profilePicUrl) return null;

    return { bio, profilePicUrl, followerHint };
  } catch {
    // Network error, timeout, abort — all expected scenarios
    return null;
  }
}
