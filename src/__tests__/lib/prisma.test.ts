describe('Prisma Database Configuration', () => {
  it('should export prisma client instance', async () => {
    const { prisma } = await import('@/lib/db/prisma');
    expect(prisma).toBeDefined();
    expect(typeof prisma).toBe('object');
  });

  it('should have expected client methods', async () => {
    const { prisma } = await import('@/lib/db/prisma');
    
    // Check for common Prisma client methods
    expect(prisma.$connect).toBeDefined();
    expect(prisma.$disconnect).toBeDefined();
    expect(typeof prisma.$connect).toBe('function');
    expect(typeof prisma.$disconnect).toBe('function');
  });

  it('should handle multiple imports correctly', async () => {
    // Test that the singleton pattern works
    const import1 = await import('@/lib/db/prisma');
    const import2 = await import('@/lib/db/prisma');
    
    expect(import1.prisma).toBe(import2.prisma);
  });
});