import db from "../db.server";

interface translationsCondition {
  shop: string,
  resourceId: string,
  field?: string,
  locale: string,
  market?: string,
}

const defaultCondition: translationsCondition = {
  shop: '',
  resourceId: '',
  field: '',
  locale: '',
  market: '',
}

export const Translations = {
  getByResourceId : async (condition: translationsCondition) => {
    condition = {...defaultCondition, ...condition};
    const {shop, resourceId, field, locale, market} = condition;

    const rows = await db.translations.findMany({
      where: { shop, resourceId, locale, market },
      orderBy: {
        updatedAt: { sort: 'asc', nulls: 'last' },
      },
    });
  
    if (rows.length === 0) return [];
  
    return rows;
  },

  getById : async (id: string) => {
    const row = await db.translations.findFirst({
      where: { id }
    });
    
    if (!row) {
      return null;
    }
    
    return row;
  },

  get : async (condition: translationsCondition) => {
    condition = {...defaultCondition, ...condition};
    const {shop, resourceId, field, locale, market} = condition;

    const row = await db.translations.findFirst({
      where: { shop, resourceId, field, locale, market },
    });
    
    if (!row) {
      return null;
    }
    
    return row;
  },

  find: async (key: string, resourceTypes: [] = [], page = 0, perPage = 10) => {
    const where = { 
      translation: {
        contains: key,
      },
    }
    if (resourceTypes && resourceTypes.length > 0) {
      where['resourceType'] = {
        in: resourceTypes
      };
    }

    const total = await db.translations.count({
      where
    });
    const rows = await db.translations.findMany({
      skip: page * perPage,
      take: perPage,
      where,
      // orderBy: {
      //   parentId: { sort: 'asc', nulls: 'first' },
      // },
    });
  
    if (rows.length === 0) return [];
  
    return {total, rows};
  },

  fillParent: async (parentId: string, condition: translationsCondition) => {
    condition = {...defaultCondition, ...condition};
    const {shop, resourceId} = condition;

    const translation = await db.translations.updateMany({
      where: {
        shop,
        resourceId
      },
      data: {
        parentId
      },
    })
  }
}