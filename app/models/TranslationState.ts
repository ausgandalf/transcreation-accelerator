import prisma from "../db.server";

export type TranslationStatus =
  | "in_progress"
  | "confirmed"
  | "needs_attention"
  | "not_translated";

export interface TranslationStateCondition {
  shop: string;
  resourceId: string;
  field?: string;
  locale: string;
  market?: string;
}

export interface TranslationStateData {
  shop: string;
  resourceId: string;
  field: string;
  locale: string;
  market: string;
  status: TranslationStatus;
  previousValue?: string;
}

const defaultCondition: TranslationStateCondition = {
  shop: "",
  resourceId: "",
  field: "",
  locale: "",
  market: "",
};

export const TranslationState = {
  getByResourceId: async (condition: TranslationStateCondition) => {
    condition = { ...defaultCondition, ...condition };
    const { shop, resourceId, locale, market } = condition;

    const rows = await prisma.translationState.findMany({
      where: { shop, resourceId, locale, market },
      orderBy: {
        field: "asc",
      },
    });

    if (rows.length === 0) return [];

    return rows;
  },

  get: async (condition: TranslationStateCondition) => {
    condition = { ...defaultCondition, ...condition };
    const { shop, resourceId, field, locale, market } = condition;

    const row = await prisma.translationState.findFirst({
      where: { shop, resourceId, field, locale, market },
    });

    if (!row) {
      return null;
    }

    return row;
  },

  upsert: async (data: TranslationStateData) => {
    // Ensure market is never undefined or null
    if (!data.market) {
      data.market = "";
    }

    const where = {
      shop_resourceId_field_locale_market: {
        shop: data.shop,
        resourceId: data.resourceId,
        field: data.field,
        locale: data.locale,
        market: data.market,
      },
    };
    console.log("YYYYYYYYYYYYYYYYYYYYYYYYYYYY", data);

    try {
      const row = await prisma.translationState.upsert({
        where,
        update: data,
        create: data,
      });
      return row;
    } catch (e) {
      console.error(e);
      throw e;
    }
  },

  delete: async (condition: TranslationStateCondition) => {
    condition = { ...defaultCondition, ...condition };
    const { shop, resourceId, field, locale, market } = condition;

    try {
      await prisma.translationState.delete({
        where: {
          shop_resourceId_field_locale_market: {
            shop,
            resourceId,
            field,
            locale,
            market,
          },
        },
      });
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },
};

// These individual exported functions are used in the route files
export const getTranslationState = async (
  shop: string,
  resourceId: string,
  field: string,
  locale: string,
  market: string,
) => {
  return TranslationState.get({
    shop,
    resourceId,
    field,
    locale,
    market,
  });
};

export const updateTranslationState = async (
  shop: string,
  resourceId: string,
  field: string,
  locale: string,
  market: string,
  data: { status?: TranslationStatus; previousValue?: string },
) => {
  return TranslationState.upsert({
    shop,
    resourceId,
    field,
    locale,
    market,
    status: data.status as TranslationStatus,
    previousValue: data.previousValue,
  });
};

export const deleteTranslationState = async (
  shop: string,
  resourceId: string,
  field: string,
  locale: string,
  market: string,
) => {
  return TranslationState.delete({
    shop,
    resourceId,
    field,
    locale,
    market,
  });
};
