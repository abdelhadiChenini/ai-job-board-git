/**
 * Prerender-safe Prisma reads.
 *
 * The shared MySQL host drops connections intermittently, which crashes
 * `next build` during static generation. These helpers degrade to a fallback
 * instead of throwing so an unreachable database blanks a prerendered page
 * rather than failing the entire build.
 *
 * Only use for reads reached by statically prerendered routes. Never use it for
 * writes or for reads that drive authorization — a silent fallback there would
 * hide real faults.
 */
export async function safeRead<T>(
  label: string,
  read: () => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await read();
  } catch (error) {
    console.error(`[prerender] ${label} failed, using fallback:`, error);
    return fallback;
  }
}
