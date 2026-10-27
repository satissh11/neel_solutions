import { prisma } from './prisma';

// Reviews and order returns are stored with plain SQL so they keep working even when the
// generated Prisma client on the server is older than the schema. The tables are created
// automatically (IF NOT EXISTS), so no manual SQL or migration step is required.

const REVIEW_TABLE = `CREATE TABLE IF NOT EXISTS \`Review\` (
  \`id\` VARCHAR(191) NOT NULL,
  \`name\` VARCHAR(120) NOT NULL,
  \`email\` VARCHAR(191) NOT NULL,
  \`product\` VARCHAR(160) NULL,
  \`rating\` INTEGER NOT NULL,
  \`text\` TEXT NOT NULL,
  \`status\` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updatedAt\` DATETIME(3) NOT NULL,
  INDEX \`Review_status_createdAt_idx\`(\`status\`, \`createdAt\`),
  PRIMARY KEY (\`id\`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;

const RETURN_COLUMNS = `
  \`id\` VARCHAR(191) NOT NULL,
  \`orderId\` VARCHAR(191) NOT NULL,
  \`reason\` VARCHAR(120) NOT NULL,
  \`details\` VARCHAR(1000) NULL,
  \`status\` ENUM('REQUESTED', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'REQUESTED',
  \`adminNote\` VARCHAR(500) NULL,
  \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  \`updatedAt\` DATETIME(3) NOT NULL,
  UNIQUE INDEX \`OrderReturn_orderId_key\`(\`orderId\`),
  PRIMARY KEY (\`id\`)`;

const RETURN_TABLE_WITH_FK = `CREATE TABLE IF NOT EXISTS \`OrderReturn\` (${RETURN_COLUMNS},
  CONSTRAINT \`OrderReturn_orderId_fkey\` FOREIGN KEY (\`orderId\`) REFERENCES \`Order\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;

const RETURN_TABLE_PLAIN = `CREATE TABLE IF NOT EXISTS \`OrderReturn\` (${RETURN_COLUMNS}
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;

let reviewsReady: Promise<boolean> | null = null;
let returnsReady: Promise<boolean> | null = null;

async function run(sql: string): Promise<boolean> {
  try {
    await prisma.$executeRawUnsafe(sql);
    return true;
  } catch (error: any) {
    console.error('[DB] Could not create table:', error?.message);
    return false;
  }
}

export function ensureReviewsTable(): Promise<boolean> {
  if (!reviewsReady) {
    reviewsReady = run(REVIEW_TABLE).then(ok => { if (!ok) reviewsReady = null; return ok; });
  }
  return reviewsReady;
}

export function ensureReturnsTable(): Promise<boolean> {
  if (!returnsReady) {
    returnsReady = (async () => {
      if (await run(RETURN_TABLE_WITH_FK)) return true;
      // Fall back to a table without the foreign key if the server rejects it.
      return run(RETURN_TABLE_PLAIN);
    })().then(ok => { if (!ok) returnsReady = null; return ok; });
  }
  return returnsReady;
}

export interface ReturnRow {
  id: string;
  orderId: string;
  reason: string;
  details: string | null;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED';
  adminNote: string | null;
  createdAt: Date;
}

// Returns a map of orderId -> return request. Throws if the table cannot be read.
export async function loadReturnsFor(orderIds: string[]): Promise<Map<string, ReturnRow>> {
  const map = new Map<string, ReturnRow>();
  if (!orderIds.length) return map;
  await ensureReturnsTable();
  const placeholders = orderIds.map(() => '?').join(',');
  const rows = await prisma.$queryRawUnsafe(
    `SELECT id, orderId, reason, details, status, adminNote, createdAt FROM \`OrderReturn\` WHERE orderId IN (${placeholders})`,
    ...orderIds,
  ) as ReturnRow[];
  for (const row of rows) map.set(row.orderId, row);
  return map;
}
