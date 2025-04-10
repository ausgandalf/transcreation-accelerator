import { findRenderedComponentWithType } from "react-dom/test-utils";
import db from "../db.server";
import { raw } from "@prisma/client/runtime/library";

export interface SyncProcessRow {
  shop: string,
  resourceType: string,
  cursor?: string,
  hasNext?: boolean,
}

export interface SyncTranslationsRow {
  shop: string,
  resourceType: string,
  resourceId: string,
  status?: number,
}

export const Sync = {
  
  getTranslations: async (shop:string) => {
    const rows = await db.syncTranslations.findMany({
      take: 1,
      where: {
        shop,
        status : 0,
      }
    });

    return rows;
  },

  getSync: async (info: SyncProcessRow) => {
    
    const { shop, resourceType } = info;
    const row = await db.syncProcess.findFirst({
      where: { shop, resourceType },
    });
    return row;
  },

  modifyTranslations: async (row: SyncTranslationsRow) => {
    const {shop, resourceType, resourceId, status} = row;
    if ('id' in row) delete row.id;

    const where = {
      shop_resourceType_resourceId: {
        shop,
        resourceType,
        resourceId,
      }
    }
    
    let newRow:any = false;
    try {
      newRow = await db.syncTranslations.upsert({
        where,
        update: row,
        create: row,
      });  
    } catch (e) {
      console.log(e);
      throw e;
    }
    
    return newRow;
  },
  modifyProcess: async (row: SyncProcessRow) => {
    const {shop, resourceType, cursor, hasNext} = row;
    const where = {
      shop_resourceType: {
        shop,
        resourceType,
      }
    }
    
    let newRow:any = false;
    try {
      newRow = await db.syncProcess.upsert({
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