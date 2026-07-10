"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.quotationRepository = void 0;
const AppError_1 = require("../../common/errors/AppError");
const prisma_1 = __importDefault(require("../../config/prisma"));
const createQuotation = async (payload) => {
    const quotation = await prisma_1.default.quotation.create({
        data: payload,
    });
    if (!quotation) {
        throw new AppError_1.AppError("Failed to create quotation", 500, "QUOTATION_CREATE_FAILED");
    }
    return quotation;
};
const getQuotationsRepository = async () => {
    const quotation = await prisma_1.default.quotation.findMany({
        orderBy: {
            createdAt: "desc"
        },
        select: {
            id: true,
            quotationNumber: true,
            clientName: true,
            createdAt: true
        }
    });
    return quotation;
};
const quotationByIdRepository = async (id) => {
    return await prisma_1.default.quotation.findUnique({
        where: {
            id,
        },
        include: {
            items: true,
        }
    });
};
const updateQuotationRepository = async (id, payload) => {
    return prisma_1.default.$transaction(async (tx) => {
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
                data: payload.items.map((item) => ({
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
const deleteQuotationRepository = async (id) => {
    const existingQuotation = await prisma_1.default.quotation.findUnique({
        where: { id },
    });
    if (!existingQuotation) {
        throw AppError_1.AppError.notFound("Quotation not found");
    }
    return prisma_1.default.quotation.delete({
        where: { id },
        include: {
            items: true,
        },
    });
};
const getAllQuotationsRepository = async (query) => {
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
    ];
    const safeSortBy = allowedSortFields.includes(sortBy)
        ? sortBy
        : "createdAt";
    const skip = (page - 1) * limit;
    const where = search
        ? {
            OR: [
                {
                    quotationNumber: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    clientName: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    companyName: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
                {
                    salesPersonName: {
                        contains: search,
                        mode: "insensitive",
                    },
                },
            ],
        }
        : {};
    const [data, total] = await Promise.all([
        prisma_1.default.quotation.findMany({
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
        prisma_1.default.quotation.count({
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
exports.quotationRepository = {
    createQuotation,
    getQuotationsRepository,
    quotationByIdRepository,
    updateQuotationRepository,
    deleteQuotationRepository,
    getAllQuotationsRepository
};
