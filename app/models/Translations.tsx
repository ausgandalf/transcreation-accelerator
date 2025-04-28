import { findRenderedComponentWithType } from "react-dom/test-utils";
import db from "../db.server";

export interface TranslationsCondition {
  shop: string,
  resourceId: string,
  field?: string,
  locale: string,
  market?: string,
}

export interface TranslationRow {
  shop: string,
  resourceType: string,
  resourceId: string,
  parentId: string,
  field: string,
  locale: string,
  market: string,
  content?: string,
  translation: string,
  updatedAt?: string,
  status?: string,
}

const defaultCondition: TranslationsCondition = {
  shop: '',
  resourceId: '',
  field: '',
  locale: '',
  market: '',
}

export const Translations = {
  getByResourceId : async (condition: TranslationsCondition) => {
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

  get : async (condition: TranslationsCondition) => {
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

  getTitle : async (shop: string, resourceId: string) => {
    // Let's try to find 'title' key
    let row = await db.translations.findFirst({
      where: { shop, resourceId, field: 'title'},
    });
    
    if (!row) {
      // Let's try to find 'label' key
      row = await db.translations.findFirst({
        where: { shop, resourceId, field: 'label'},
      });
      if (!row) {
        return '';
      }
    }
    
    return row.content;
  },

  find: async (key: string, resourceTypes: [] = [], locales: [] = [], page = 0, perPage = 10) => {
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
    if (locales && locales.length > 0) {
      where['locale'] = {
        in: locales
      };
    }
    // console.log(where);

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
  
    return {total, rows};
  },

  fillParent: async (parentId: string, condition: TranslationsCondition) => {
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
  },
  clearTranslations: async (shop: string, resourceId:string) => {
    const translations = await db.translations.updateMany({
      where: {
        shop,
        resourceId
      },
      data: {
        translation: ''
      },
    });

    const subTranslations = await db.translations.updateMany({
      where: {
        shop,
        parentId: resourceId
      },
      data: {
        translation: ''
      },
    })
  },
  insertOrUpdate: async (row: TranslationRow) => {
    
    const where = {
      shop_resourceId_field_locale_market: {
        shop: row.shop,
        resourceId: row.resourceId,
        field: row.field,
        locale: row.locale,
        market: row.market,     
      }
    }
    if (!row.updatedAt) delete row.updatedAt; // Remove updatedAt to make it NULL if not set.
    
    let newRow:any = false;
    try {
      newRow = await db.translations.upsert({
        where,
        update: row,
        create: row,
      });  
    } catch (e) {
      console.log(e);
      throw e;
    }
    
    return newRow;
  }
}