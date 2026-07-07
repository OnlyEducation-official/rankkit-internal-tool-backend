import { AppError } from "../../common/errors/AppError";
import prisma from "../../config/prisma";
import { TGetAllQuotationsQuery } from "./quotation.validation";

const createQuotation = async (payload: any) => {

  const quotation = await prisma.quotation.create({
    data: payload,
  });

  if (!quotation) {
    throw new AppError(
      "Failed to create quotation",
      500,
      "QUOTATION_CREATE_FAILED"
    );
  }

  return quotation;
};

const getQuotationsRepository = async () => {
  const quotation = await prisma.quotation.findMany({
    orderBy: {
      createdAt: "desc"
    },
    select: {
      id: true,
      quotationNumber: true,
      clientName: true,
      createdAt: true
    }
  })

  return quotation

}

const quotationByIdRepository = async (id: string) => {
  return await prisma.quotation.findUnique({
    where: {
      id,
    },
    include: {
      items: true,
    }
  })
}

const updateQuotationRepository = async (id: string, payload: any) => {

  return prisma.$transaction(async (tx) => {
    // 1) update main quotation (without items)
    const updatedQuotation = await tx.quotation.update({
      where: { id },
      data: payload.data, // all scalar fields
    });

    // 2) replace items if provided
    if (payload.items) {
      await tx.quotationItem.deleteMany({
        where: { quotationId: id },
      });

      await tx.quotationItem.createMany({
        data: payload.items.map((item: any) => ({
          quotationId: id,
          title: item.title,
          description: item.description,
          rate: item.rate,
        })),
      });
    }

    // 3) return with items
    return tx.quotation.findUnique({
      where: { id },
      include: { items: true },
    });
  });

};

const deleteQuotationRepository = async (id: string) => {
  const existingQuotation = await prisma.quotation.findUnique({
    where: { id },
  });

  if (!existingQuotation) {
    throw AppError.notFound("Quotation not found");
  }

  return prisma.quotation.delete({
    where: { id },
    include: {
      items: true,
    },
  });
};

const getAllQuotationsRepository = async (query: TGetAllQuotationsQuery) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 25;
  const search = query.search?.trim() || "";
  const sortBy = query.sortBy || "createdAt";
  const sortOrder = query.sortOrder || "desc";

  const allowedSortFields = [
    "createdAt",
    "updatedAt",
    "quotationNumber",
    "clientName",
    "companyName",
    "salesPersonName",
  ] as const;

  const safeSortBy = allowedSortFields.includes(sortBy as any)
    ? sortBy
    : "createdAt";

  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          {
            quotationNumber: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            clientName: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            companyName: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
          {
            salesPersonName: {
              contains: search,
              mode: "insensitive" as const,
            },
          },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.quotation.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [safeSortBy]: sortOrder,
      },
      include: {
        items: true,
      },
    }),
    prisma.quotation.count({
      where,
    }),
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data,
  };
};


export const quotationRepository = {
  createQuotation,
  getQuotationsRepository,
  quotationByIdRepository,
  updateQuotationRepository,
  deleteQuotationRepository,
  getAllQuotationsRepository
};