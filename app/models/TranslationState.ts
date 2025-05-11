import prisma from "../db.server";

export type TranslationStatus =
  | "in_progress"
  | "confirmed"
  | "needs_attention"
  | "not_translated";

export type ResourceType = "product" | "option" | "option_value";

export interface TranslationStateCondition {
  shop: string;
  resourceId: string;
  resourceType?: ResourceType;
  parentProductId?: string;
  field?: string;
  locale: string;
  market?: string;
}

export interface TranslationStateData {
  shop: string;
  resourceId: string;
  resourceType: ResourceType;
  parentProductId?: string;
  field: string;
  locale: string;
  market: string;
  status: TranslationStatus;
  previousValue?: string;
}

const defaultCondition: TranslationStateCondition = {
  shop: "",
  resourceId: "",
  resourceType: "product" as ResourceType,
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

  getByParentProductId: async (condition: Omit<TranslationStateCondition, 'resourceId'> & { parentProductId: string, resourceId?: string }) => {
    const { shop, parentProductId, locale, market } = condition;

    if (!parentProductId) {
      return [];
    }

    const whereClause: any = { 
      shop, 
      locale, 
      market: market || "",
    };

    whereClause.parentProductId = parentProductId;
    
    let rows = await prisma.translationState.findMany({
      where: whereClause,
    });
    
    if (rows.length === 0) {
      delete whereClause.parentProductId;
      whereClause.resourceId = parentProductId;
      
      rows = await prisma.translationState.findMany({
        where: whereClause,
      });
    }

    if (rows.length > 0) {
      rows.sort((a: any, b: any) => {
        const resourceTypeOrder: Record<string, number> = { 
          product: 0, 
          option: 1, 
          option_value: 2 
        };
        
        const aType = resourceTypeOrder[a.resourceType as string] || 99;
        const bType = resourceTypeOrder[b.resourceType as string] || 99;
        
        if (aType !== bType) {
          return aType - bType;
        }
        
        return (a.field as string).localeCompare(b.field as string);
      });
    }

    return rows;
  },

  get: async (condition: TranslationStateCondition) => {
    condition = { ...defaultCondition, ...condition };
    const { shop, resourceId, field, locale, market } = condition;

    const row = await prisma.translationState.findFirst({
      where: { 
        shop, 
        resourceId, 
        field: field || "", 
        locale, 
        market: market || "" 
      },
    });

    if (!row) {
      return null;
    }

    return row;
  },

  upsert: async (data: TranslationStateData) => {
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

    try {
      const dataWithNewFields: any = {
        ...data,
        resourceType: data.resourceType,
        parentProductId: data.parentProductId,
      };

      const row = await prisma.translationState.upsert({
        where,
        update: dataWithNewFields,
        create: dataWithNewFields,
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
            field: field || "",
            locale,
            market: market || "",
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

export const getTranslationStateByParentProductId = async (
  shop: string,
  parentProductId: string,
  locale: string,
  market: string,
) => {
  return TranslationState.getByParentProductId({
    shop,
    parentProductId,
    locale,
    market,
    resourceId: "",
  } as any);
};

export const updateTranslationState = async (
  shop: string,
  resourceId: string,
  field: string,
  locale: string,
  market: string,
  data: { status?: TranslationStatus; previousValue?: string },
  resourceType: ResourceType = "product",
  parentProductId?: string,
) => {
  const finalParentProductId = parentProductId || 
    (resourceType === "product" ? resourceId : undefined);

  return TranslationState.upsert({
    shop,
    resourceId,
    resourceType,
    parentProductId: finalParentProductId,
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
