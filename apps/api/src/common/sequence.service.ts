import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async next(organizationId: string, key: string, prefix: string, tx?: any): Promise<string> {
    const db = tx ?? this.prisma;
    const row = await db.numberSequence.upsert({
      where: { organizationId_key: { organizationId, key } },
      create: { organizationId, key, prefix, nextNumber: 2 },
      update: { nextNumber: { increment: 1 } },
    });
    const n = row.nextNumber === 2 && row.prefix === prefix ? 1 : row.nextNumber - 1;
    const seq = await db.numberSequence.findUniqueOrThrow({
      where: { organizationId_key: { organizationId, key } },
    });
    const num = seq.nextNumber - 1;
    return `${prefix}-${String(num).padStart(5, "0")}`;
  }

  async nextInTx(tx: any, organizationId: string, key: string, prefix: string) {
    const existing = await tx.numberSequence.findUnique({
      where: { organizationId_key: { organizationId, key } },
    });
    if (!existing) {
      await tx.numberSequence.create({
        data: { organizationId, key, prefix, nextNumber: 2 },
      });
      return `${prefix}-00001`;
    }
    const num = existing.nextNumber;
    await tx.numberSequence.update({
      where: { id: existing.id },
      data: { nextNumber: { increment: 1 } },
    });
    return `${prefix}-${String(num).padStart(5, "0")}`;
  }
}
