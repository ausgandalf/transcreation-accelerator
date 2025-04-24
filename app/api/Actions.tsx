import { getShopLocales, getShopMarkets, getProduct, getCollectionInfo, getTranslationsByIds } from "app/api/GraphQL";
import { TranslationRow, Translations } from "app/models/Translations";
import { SyncTranslationsRow, SyncProcessRow, Sync } from "app/models/Sync";
import { getTranslatableIds } from "app/api/GraphQL";
import { getIDBySection } from "app/components/Functions";
import { resourceTypePath } from "./data";

export async function doSyncProcess(graphql, shop:string, resourceType:string, forceRestart:boolean = false):boolean { 
  let cursor:string = '';
  let hasNext:boolean = true;

  if (!forceRestart) {
    const syncProcessRow = await Sync.getSync({shop, resourceType: resourceType});
    // console.log('Sync row: ', syncProcessRow);
    cursor = syncProcessRow ? syncProcessRow.cursor : '';
    hasNext = syncProcessRow ? syncProcessRow.hasNext : true;
  }

  let ids:any = false;
  let endLoop = hasNext ? 0 : 10;
  while (endLoop < 10) {
    try {
      endLoop ++;
      ids = await getTranslatableIds(graphql, resourceType, cursor);
      endLoop = 10;
    } catch (e) {}
  }
  
  if ( ids ) {
    if ( ids.nodes ) {
      // Insert into DB
      for (let i=0; i<ids.nodes.length; i++) {
        await Sync.modifyTranslations({
          shop,
          resourceType: resourceType,
          resourceId: ids.nodes[i].resourceId,
          status: 0,
        })
      }
    }

    hasNext = ids.pageInfo ? ids.pageInfo.hasNextPage : false;
    await Sync.modifyProcess({
      shop,
      resourceType,
      cursor: ids.pageInfo ? ids.pageInfo.endCursor : '',
      hasNext, 
    });
    
  } else {
    hasNext = false;
    await Sync.modifyProcess({
      shop,
      resourceType,
      cursor: '',
      hasNext,
    });
  }

  return hasNext;
}

export const syncProductTranslations = async (shop:string, admin:any, productIdValue:any, isWebhook = false) => {
  // TODO
  productIdValue = `${productIdValue}`;
  const productId = `gid://shopify/Product/${productIdValue}`;
  
  // Clear translations
  Translations.clearTranslations(shop, productIdValue);

  let locales = [];
  let markets = [];
  // Load locales and markets
  // console.log('feching locales...');
  let endLoop = 0;
  while (endLoop < 10) {
    try {
      endLoop ++;
      locales = await getShopLocales(admin.graphql, isWebhook);
      endLoop = 10;
    } catch (e) {
      console.log(e);
    }
  }
  // console.log('Locales fetched: ', locales);

  // console.log('feching markets...');
  endLoop = 0;
  while (endLoop < 10) {
    try {
      endLoop ++;
      markets = await getShopMarkets(admin.graphql, isWebhook);
      endLoop = 10;
    } catch (e) {
      console.log(e);
    }
  }
  // console.log('Markets fetched: ', markets);

  // Load product info
  let product:any = false;
  endLoop = 0;
  while (endLoop < 10) {
    try {
      endLoop ++;
      product = await getProduct(admin.graphql, productId, isWebhook);
      endLoop = 10;
    } catch (e) {}
  }
  // console.log('Product fetched:', product);

  let dataset:TranslationRow[] = [];
  const idTypes = {};

  if (product) {
    let ids = [ product.id ];
    idTypes[product.id] = 'PRODUCT';

    product.options.map((x, i) => {
      ids.push(x.id);
      idTypes[x.id] = 'PRODUCT_OPTION';
      x.optionValues.map((y, j) => {
        ids.push(y.id);
        idTypes[y.id] = 'PRODUCT_OPTION_VALUE';
      })
    })

    for (let marketIndex = 0; marketIndex < markets.length + 1; marketIndex++) {

      const marketId = ( marketIndex == 0 ) ? '' : markets[marketIndex - 1]['id'];
      const marketLabel = ( marketIndex == 0 ) ? '' : markets[marketIndex - 1]['name'];

      for (let localeIndex = 0; localeIndex < locales.length; localeIndex++) {
        const locale = locales[localeIndex];
        if ((marketIndex == 0) && (locale.primary)) continue;

        // Load Translation data
        let transSet = [];
        endLoop = 0; // We fetch translation data only when product is found.
        while (endLoop < 10) {
          try {
            endLoop ++;
            const result = await getTranslationsByIds(admin.graphql, JSON.stringify(ids), locales[localeIndex]['locale'], marketId, isWebhook);
            transSet = result.transdata;
            endLoop = 10;
          } catch (e) {
            // console.log(e);
          }
        }
        // console.log('transSet fetched:', transSet);

        transSet.map((x, i) => {
          let translations = {};
          x.translations.map((y, j) => {
            translations[y.key] = {
              value: y.value,
              updatedAt: y.updatedAt,
              locale: y.locale,
            }
          })
          x.translatableContent.map((y, j) => {
            dataset.push({
              shop,
              resourceType: idTypes[x.resourceId],
              resourceId: x.resourceId.split('/').pop(),
              parentId: productIdValue,
              field: y.key,
              locale: locales[localeIndex]['locale'],
              market: marketLabel,
              content: y.value,
              translation: translations[y.key] ? translations[y.key].value : '',
              updatedAt: translations[y.key] ? translations[y.key].updatedAt : '',
            });
          })
        })
        
      }
    }

    for (let i=0; i<dataset.length; i++) {
      try {
        await Translations.insertOrUpdate(dataset[i]);
      } catch(e) {
        // console.log(e);
      }
    }

  }

}

export const syncCollectionTranslations = async (shop:string, admin:any, collectionIdValue:any, isWebhook = false) => {
  // TODO
  collectionIdValue = `${collectionIdValue}`;
  const collectionId = `gid://shopify/Collection/${collectionIdValue}`;
  
  // Clear translations
  Translations.clearTranslations(shop, collectionId);

  let locales = [];
  let markets = [];
  // Load locales and markets
  // console.log('feching locales...');
  let endLoop = 0;
  while (endLoop < 10) {
    try {
      endLoop ++;
      locales = await getShopLocales(admin.graphql, isWebhook);
      endLoop = 10;
    } catch (e) {
      console.log(e);
    }
  }
  // console.log('Locales fetched: ', locales);

  // console.log('feching markets...');
  endLoop = 0;
  while (endLoop < 10) {
    try {
      endLoop ++;
      markets = await getShopMarkets(admin.graphql, isWebhook);
      endLoop = 10;
    } catch (e) {
      console.log(e);
    }
  }
  // console.log('Markets fetched: ', markets);

  // Load product info
  let collection:any = false;
  endLoop = 0;
  while (endLoop < 10) {
    try {
      endLoop ++;
      collection = await getCollectionInfo(admin.graphql, collectionId, isWebhook);
      endLoop = 10;
    } catch (e) {}
  }
  // console.log('Product fetched:', product);

  let dataset:TranslationRow[] = [];
  const idTypes = {};

  if (collection) {
    let ids = [ collection.id ];
    idTypes[collection.id] = 'COLLECTION';

    for (let marketIndex = 0; marketIndex < markets.length + 1; marketIndex++) {

      const marketId = ( marketIndex == 0 ) ? '' : markets[marketIndex - 1]['id'];
      const marketLabel = ( marketIndex == 0 ) ? '' : markets[marketIndex - 1]['name'];

      for (let localeIndex = 0; localeIndex < locales.length; localeIndex++) {
        const locale = locales[localeIndex];
        if ((marketIndex == 0) && (locale.primary)) continue;

        // Load Translation data
        let transSet = [];
        endLoop = 0; // We fetch translation data only when product is found.
        while (endLoop < 10) {
          try {
            endLoop ++;
            const result = await getTranslationsByIds(admin.graphql, JSON.stringify(ids), locales[localeIndex]['locale'], marketId, isWebhook);
            transSet = result.transdata;
            endLoop = 10;
          } catch (e) {
            // console.log(e);
          }
        }
        // console.log('transSet fetched:', transSet);

        transSet.map((x, i) => {
          let translations = {};
          x.translations.map((y, j) => {
            translations[y.key] = {
              value: y.value,
              updatedAt: y.updatedAt,
              locale: y.locale,
            }
          })
          x.translatableContent.map((y, j) => {
            dataset.push({
              shop,
              resourceType: idTypes[x.resourceId],
              resourceId: x.resourceId.split('/').pop(),
              parentId: collectionIdValue,
              field: y.key,
              locale: locales[localeIndex]['locale'],
              market: marketLabel,
              content: y.value,
              translation: translations[y.key] ? translations[y.key].value : '',
              updatedAt: translations[y.key] ? translations[y.key].updatedAt : '',
            });
          })
        })
        
      }
    }

    for (let i=0; i<dataset.length; i++) {
      try {
        await Translations.insertOrUpdate(dataset[i]);
      } catch(e) {
        // console.log(e);
      }
    }

  }

}

export const syncOtherTranslations = async (shop:string, admin:any, idValue:any, resourceType: string, isWebhook = false) => {
  // TODO
  idValue = `${idValue}`;
  const shopifyId = getIDBySection(idValue, resourceTypePath[resourceType]);
  
  // Clear translations
  Translations.clearTranslations(shop, shopifyId);

  let locales = [];
  let markets = [];
  // Load locales and markets
  // console.log('feching locales...');
  let endLoop = 0;
  while (endLoop < 10) {
    try {
      endLoop ++;
      locales = await getShopLocales(admin.graphql, isWebhook);
      endLoop = 10;
    } catch (e) {
      console.log(e);
    }
  }
  // console.log('Locales fetched: ', locales);

  // console.log('feching markets...');
  endLoop = 0;
  while (endLoop < 10) {
    try {
      endLoop ++;
      markets = await getShopMarkets(admin.graphql, isWebhook);
      endLoop = 10;
    } catch (e) {
      console.log(e);
    }
  }
  // console.log('Markets fetched: ', markets);

  let dataset:TranslationRow[] = [];
  const idTypes = {};

  
  let ids = [ shopifyId ];
  idTypes[shopifyId] = resourceType;

  for (let marketIndex = 0; marketIndex < markets.length + 1; marketIndex++) {

    const marketId = ( marketIndex == 0 ) ? '' : markets[marketIndex - 1]['id'];
    const marketLabel = ( marketIndex == 0 ) ? '' : markets[marketIndex - 1]['name'];

    for (let localeIndex = 0; localeIndex < locales.length; localeIndex++) {
      const locale = locales[localeIndex];
      if ((marketIndex == 0) && (locale.primary)) continue;

      // Load Translation data
      let transSet = [];
      endLoop = 0; // We fetch translation data only when product is found.
      while (endLoop < 10) {
        try {
          endLoop ++;
          const result = await getTranslationsByIds(admin.graphql, JSON.stringify(ids), locales[localeIndex]['locale'], marketId, isWebhook);
          transSet = result.transdata;
          endLoop = 10;
        } catch (e) {
          // console.log(e);
        }
      }
      // console.log('transSet fetched:', transSet);

      transSet.map((x, i) => {
        let translations = {};
        x.translations.map((y, j) => {
          translations[y.key] = {
            value: y.value,
            updatedAt: y.updatedAt,
            locale: y.locale,
          }
        })
        x.translatableContent.map((y, j) => {
          dataset.push({
            shop,
            resourceType: idTypes[x.resourceId],
            resourceId: x.resourceId.split('/').pop(),
            parentId: idValue,
            field: y.key,
            locale: locales[localeIndex]['locale'],
            market: marketLabel,
            content: y.value,
            translation: translations[y.key] ? translations[y.key].value : '',
            updatedAt: translations[y.key] ? translations[y.key].updatedAt : '',
          });
        })
      })
      
    }
  }

  for (let i=0; i<dataset.length; i++) {
    try {
      await Translations.insertOrUpdate(dataset[i]);
    } catch(e) {
      // console.log(e);
    }
  }

}
