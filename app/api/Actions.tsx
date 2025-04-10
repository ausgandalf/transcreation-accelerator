import { getShopLocales, getShopMarkets, getProduct, getTranslationsByIds } from "app/api/GraphQL";
import { TranslationRow, Translations } from "app/models/Translations";

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