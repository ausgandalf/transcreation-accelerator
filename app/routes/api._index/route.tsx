import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import { TranslationRow, Translations } from "app/models/Translations";
import { SyncTranslationsRow, SyncProcessRow, Sync } from "app/models/Sync";
import { syncProductTranslations, syncCollectionTranslations, syncOtherTranslations, doSyncProcess } from "app/api/Actions";
import { contentList, resourceTypePath, getResourceTypesPerSection, commonReadActions, syncTypes, emailTemplateNames, emailTemplateLabelMapper } from "app/api/data";
import { getIDBySection, makeReadable, getResourceItemLabel } from "app/components/Functions";

import { 
  getProducts, 
  getProductsWithOptions,
  getProduct, 
  getProductInfo,
  getCollectionInfo,
  getCollections,
  getBlogs,
  getArticles,
  getPages,
  getArticlesTotal,
  getTranslationsByIds, 
  setTranslations, 
  deleteTranslations,
  getImages, 
  getImageUploadEndpoint,
  createImageOnStore,
  getImageURL,
  getTranslatableIds,
  getTranslatableIdsWithTranslations,
  getMenuItemIds,
} from 'app/api/GraphQL';

import { sleep } from "app/components/Functions";
import { getResourceInfo, getResourceInfoFromDB } from "app/api/Actions";

export const loader = async ({ request }: LoaderFunctionArgs) => {

  const { admin, session } = await authenticate.admin(request);

  const url = new URL(request.url);
  const action = url.searchParams.get("q");

  let result:any = {};

  return { msg:'Welcome!' };
  // return Response.json({ msg:'Welcome!' });
};

export async function action({ request, params }) {
  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;

  const submittedFormData = await request.formData();

  /** @type {any} */
  const data = {
    ...Object.fromEntries(submittedFormData),
    shop,
  };

  let result:any = {};

  if (data.action == 'product_list') {
    // Load product list
    let endLoop = false;
    while (!endLoop) {
      try {
        result = await getProducts(admin.graphql, data.cursor, data.status, data.perPage);
        endLoop = true;
      } catch (e) {}
    }
  } else if (data.action == 'product_read') {
    // Load product info
    let product:any = false;
    let endLoop = false;
    while (!endLoop) {
      try {
        product = await getProduct(admin.graphql, data.id);
        endLoop = true;
      } catch (e) {}
    }

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
    
      // Load Translation data
      endLoop = !product; // We fetch translation data only when product is found.
      while (!endLoop) {
        try {
          result = await getTranslationsByIds(admin.graphql, JSON.stringify(ids), data.locale, data.market);
          endLoop = true;
        } catch (e) {}
      }
      result['idTypes'] = idTypes;
    }

    // result['product'] = product; // Put product info
    result['resource'] = product; // Put product info
    
  } else if (data.action == 'menu_read') {
    // Read translation by id per type
    const ids = [data.id];
    const idTypes = {};
    idTypes[data.id] = 'MENU';

    const menu = {
      id: data.id,
      items: []
    };

    // Read Menu items
    let menuItems = [];
    let endLoop = false; // We fetch translation data only when product is found.
    while (!endLoop) {
      try {
        menuItems = await getMenuItemIds(admin.graphql, data.id);
        endLoop = true;
      } catch (e) {}
    }
    
    menuItems.map((x,i) => {
      const correctShopifyId = "gid://shopify/Link/" + x.id.split('/').pop();
      ids.push(correctShopifyId);
      menu.items.push(correctShopifyId);
      idTypes[correctShopifyId] = 'MENU_ITEM';
    })
    
    // Load Translation data
    endLoop = false; // We fetch translation data only when product is found.
    while (!endLoop) {
      try {
        result = await getTranslationsByIds(admin.graphql, JSON.stringify(ids), data.locale, data.market);
        endLoop = true;
      } catch (e) {
        console.log(e);
        endLoop = true;
      }
    }
    result['idTypes'] = idTypes;
    result['resource'] = menu;
    
  } else if (Object.keys(commonReadActions).includes(data.action)) {
    // Read translation by id per type
    const ids = [data.id];

    // Load Translation data
    let endLoop = 0; // We fetch translation data only when product is found.
    while (endLoop < 10) {
      try {
        endLoop++;
        result = await getTranslationsByIds(admin.graphql, JSON.stringify(ids), data.locale, data.market);
        endLoop = 10;
      } catch (e) {}
    }
    result['idTypes'] = {
      [data.id] : commonReadActions[data.action]
    };
    result['resource'] = {id: data.id};
    
  } else if (data.action == 'collection_list') {
    // Load collection list
    let endLoop = false;
    while (!endLoop) {
      try {
        result = await getCollections(admin.graphql, data.cursor, data.perPage);
        endLoop = true;
      } catch (e) {}
    }
  } else if (data.action == 'blog_list') {
    // Load blog list
    let endLoop = false;
    while (!endLoop) {
      try {
        result = await getBlogs(admin.graphql, data.cursor, data.perPage);
        endLoop = true;
      } catch (e) {}
    }
  } else if (data.action == 'article_list') {
    // Load blog list
    let endLoop = 0;
    while (endLoop < 10) {
      try {
        endLoop++;
        result = await getArticles(admin.graphql, data.cursor, data.perPage, data.status);
        endLoop = 10;
      } catch (e) {}
    }

    endLoop = 0;
    while (endLoop < 10) {
      try {
        endLoop++;
        result.total = await getArticlesTotal(admin.graphql);
        endLoop = 10;
      } catch (e) {}
    }

  } else if (data.action == 'page_list') {
    // Load blog list
    let endLoop = 0;
    while (endLoop < 10) {
      try {
        endLoop++;
        result = await getPages(admin.graphql, data.cursor, data.perPage, data.status);
        endLoop = 10;
      } catch (e) {
        // console.log(e);
      }
    }

  } else if (data.action == 'resource_list') {
    // Load blog list
    let resources;
    let endLoop = 0;
    while (endLoop < 10) {
      try {
        endLoop++;
        if (data.type == 'ONLINE_STORE_THEME_LOCALE_CONTENT') {
          const themeId = data.theme;
          const { transdata } = await getTranslationsByIds(admin.graphql, JSON.stringify(['gid://shopify/OnlineStoreThemeLocaleContent/'  + themeId]), data.locale, data.market)
          resources = {nodes: transdata};
          console.log(resources);
          // resources = await getTranslatableIdsWithTranslations(admin.graphql, data.type, data.locale, data.market, data.cursor, data.perPage);
        } else {
          resources = await getTranslatableIds(admin.graphql, data.type, data.cursor, data.perPage);
        }
        endLoop = 10;
      } catch (e) {
        console.log(e);
      }
    }

    let list = [];
    if (data.type == 'ONLINE_STORE_THEME_LOCALE_CONTENT') {
      list = resources.nodes; // Include translations
    } else {
      for (let i=0; i<resources.nodes.length; i++) {
        const node = resources.nodes[i];
        let resourceItemLabel = '';
        if (data.type == 'EMAIL_TEMPLATE') {
          let index = emailTemplateLabelMapper[i] ?? -1;
          if (index == -1) {
            resourceItemLabel = getResourceItemLabel(node.resourceId, data.type, node.translatableContent);
          } else {
            resourceItemLabel = emailTemplateNames[index];
          }
        } else {
          resourceItemLabel = getResourceItemLabel(node.resourceId, data.type, node.translatableContent);
        }
        
        list.push({
          id: node.resourceId,
          title: resourceItemLabel,
        });
      }
    }

    result = {resources: {
      pageInfo: resources.pageInfo,
      nodes: list
    }, total: list.length};

  } else if (data.action == 'trans_read') {
    // Load Product info
    const ids = JSON.parse(data.ids);

    // Load Translation data
    let endLoop = !(ids.length > 0); // We fetch translation data only when ids is not empty.
    while (!endLoop) {
      try {
        result = await getTranslationsByIds(admin.graphql, JSON.stringify(ids), data.locale, data.market);
        endLoop = true;
      } catch (e) {}
    }
    
  } else if (data.action == 'trans_submit') {
    // Load Translation data
    const translationsObj = JSON.parse(data.translations);
    const originObj = JSON.parse(data.origin);

    let results = [...Array(translationsObj.length)];
    let dataset:TranslationRow[] = []; // To save into DB for search function

    for (let i=0; i<translationsObj.length; i++) {
      results[i] = {}
      let setData = [];
      let deleteKeys = [];

      // Prepare set and delete data
      for (let j=0; j< translationsObj[i].data.length; j++) {

        if (translationsObj[i].data[j].value == '') {
          deleteKeys.push(translationsObj[i].data[j].key);
        } else {
          translationsObj[i].data[j].locale = data.locale;
          setData.push(translationsObj[i].data[j]);
        }

        const fieldValue = translationsObj[i].data[j].key;

        let parentId = data.id.split('/').pop();
        if (translationsObj[i].type == 'ONLINE_STORE_THEME_LOCALE_CONTENT') parentId = data.item;

        dataset.push({
          shop,
          resourceType: translationsObj[i].type,
          resourceId: translationsObj[i].id.split('/').pop(),
          parentId: parentId,
          field: fieldValue,
          locale: data.locale,
          market: data.marketLabel,
          content: originObj[translationsObj[i].id][fieldValue]['value'],
          translation: translationsObj[i].data[j].value,
          updatedAt: new Date().toISOString(),
        });

      }

      let endLoop = !(setData.length > 0); // If only we have setData, then try to set translations
      while (!endLoop) {
        try {
          results[i]['set'] = await setTranslations(admin.graphql, translationsObj[i].id, setData, data.market);
          endLoop = true;
        } catch (e) {}
      }

      endLoop = !(deleteKeys.length > 0); // If only we have setData, then try to set translations
      while (!endLoop) {
        try {
          results[i]['delete'] = await deleteTranslations(admin.graphql, translationsObj[i].id, deleteKeys, data.locale, data.market);
          endLoop = true;
        } catch (e) {}
      }
    }

    for (let i=0; i<dataset.length; i++) {
      try {
        await Translations.insertOrUpdate(dataset[i]);
      } catch(e) {
        // console.log(e);
      }
    }

    result['results'] = results;

  } else if (data.action == 'file_list') {
    // Load collection list
    let endLoop = false;
    while (!endLoop) {
      try {
        result = await getImages(admin.graphql, data.isNext, data.cursor, data.perPage, data.name);
        endLoop = true;
      } catch (e) {}
    }
  } else if (data.action == 'image_upload_url') {
    // Load collection list
    let endLoop = false;
    while (!endLoop) {
      try {
        result['endpoint'] = await getImageUploadEndpoint(admin.graphql, data.filename, data.filesize, data.type);
        endLoop = true;
      } catch (e) {}
    }

    /*
    const file = submittedFormData.get('file');
    console.log('trying to get file...');
    console.log(file);

    const endpoint = result['endpoint']['target'];
    const formData = new FormData();
    endpoint.parameters.map((x, i) => {
      formData.append(x.name, x.value);
    });
    formData.append('file', file);
    
    const response = await fetch(endpoint.url, {
      method: 'POST',
      body: formData,
    });
    // console.log(Object.fromEntries(formData));
    // console.log(response);

    result['google'] = await response.text();
    
    endLoop = !response.ok;
    while (!endLoop) {
      try {
        result['on_shopify'] = await createImageOnStore(admin.graphql, endpoint.resourceUrl);
        endLoop = true;
      } catch (e) {}
    }
    */

  } else if (data.action == 'create_image') {
    // Load collection list
    let endLoop = false;
    while (!endLoop) {
      try {
        result['on_shopify'] = await createImageOnStore(admin.graphql, data.url);
        endLoop = true;
      } catch (e) {}
    }
  } else if (data.action == 'upload_image') {
    // Load collection list
    const file = submittedFormData.get('file');
    const params = data.param_names.split(',');
    
    const formData = new FormData();
    params.map((x, i) => {
      formData.append(x, data[x]);  
    })
    formData.append('file', file);

    const response = await fetch(data.url, {
      method: 'POST',
      body: formData,
    });

    result = {response, formData};

    let endLoop = false;
    while (!endLoop) {
      try {
        result['on_shopify'] = await createImageOnStore(admin.graphql, data.url);
        endLoop = true;
      } catch (e) {}
    }
  } else if (data.action == 'get_image_url') {
    let endLoop = false;
    
    while (!endLoop) {
      try {
        const node = await getImageURL(admin.graphql, data.id);
        if (node) {
          if (node.fileStatus == 'READY') {
            result['url'] = node.image.url;
            result['id'] = node.id;
            endLoop = true;
          } else {
            // Sleep 1 sec, then retry
            await sleep(1000);
          }
        } else {
          // Not found
          result['url'] = '';
          result['id'] = data.id;
          endLoop = true;
        }
      } catch (e) {}
    }

  } else if (data.action == 'trans_find') {
    const resourceTypesDictionary = getResourceTypesPerSection();
    const resourceTypes = data.types ? data.types.split('|') : [];
    const locales = data.locales ? data.locales.split('|') : [];
    const q = data.q;
    const page = parseInt(data.page);
    const perPage = parseInt(data.perPage);
    let {total, rows} = await Translations.find(q, resourceTypes, locales, isNaN(page) ? 0 : page, isNaN(perPage) ? 10 : perPage);
    if (!total) total = 0;
    if (!rows) rows = [];
    // console.log('trans-find:', total, rows);

    const refined = {};
    rows.map((x, i) => {

      let v = x.translation;
      const pos = v.indexOf(q);
      const minPos = Math.max(0, pos - 45);
      const maxPos = Math.min(v.length, pos + 45 + q.length);
      v = v.substring(minPos, maxPos);
      v = v.replaceAll("<", "&lt;").replaceAll(">", "&gt;");
      v = v.replaceAll(q, `<em>${q}</em>`);

      const _path = resourceTypePath[x.resourceType];
      const objId = (_path == 'content') ? x.parentId : getIDBySection(x.parentId ? x.parentId : x.resourceId, _path);
      // console.log(x);
      // console.log(objId);
      if (!(objId in refined)) {
        refined[objId] = {
          _path,
          info: {
            id: (_path == 'content') ? getIDBySection(x.resourceId, _path) : objId,
            item: (_path == 'content') ? x.parentId : '',
            title: (_path == 'content') ? contentList[objId].label : ''
          },
          items: []
        };
      }
      refined[objId].items.push({...x, parentId:objId, highlight:v, _path, key: x.field, value:x.content});
    });

    // console.log('trans-refined:', refined);

    for (let key in refined) {
      // Get resource info via GraphQL, 
      // (-- but let's skip to reduce GraphQL api interaction..., instead, we will get the title from DB --)
      // refined[key].info = await getResourceInfo(shop, admin.graphql, key, refined[key]._path);
      
      const _path = refined[key]._path;
      if (_path == 'content') {
        // DO NOTHING, already set before.
      } else {
        // Get the title from DB, to reduce GraphQL usage rate
        refined[key].info = await getResourceInfoFromDB(shop, key);
        if (refined[key].info.title == '') {
          refined[key].info.title = getResourceItemLabel(key, resourceTypesDictionary[refined[key]._path][0], refined[key].items);
        }
      }
    }
    // console.log('product-info-filled-up:', refined);
    result['result'] = {total, found: rows.length, result: refined};

  } else if (data.action == 'trans_fill_parents') {
    // Load product list
    let endLoop = false;
    while (!endLoop) {
      try {
        result = await getProductsWithOptions(admin.graphql, data.cursor, data.perPage);
        endLoop = true;
      } catch (e) {}
    }
    // console.log('products fetched: ', result);

    if (result.products) {
      result.products.nodes.map((x, i) => {
        const productId = x.id.split('/').pop();
        x.options.map((y, j) => {
          const optionId = y.id.split('/').pop();
          Translations.fillParent(productId, {
            shop,
            resourceId: optionId
          });
          y.optionValues.map((z, k) => {
            const optionValueId = z.id.split('/').pop();
            Translations.fillParent(productId, {
              shop,
              resourceId: optionValueId
            });
          })
        })
      })
      result.pageInfo = {
        cursor: result.products.pageInfo.endCursor,
        hasNext: result.products.pageInfo.hasNextPage,
      }
    } else {
      result.pageInfo = {
        cursor: '',
        hasNext: false,
      }
    }
    
  } else if (data.action == 'sync_process') {
    // Load product list
    const forceRestart = (data.force == '1');
    const jobs = [...syncTypes];

    let hasNext = false;
    for (let i=0; i<jobs.length; i++) {
      hasNext = hasNext || await doSyncProcess(admin.graphql, shop, jobs[i], forceRestart);
    }

    result = { hasNext };

  } else if (data.action == 'sync_do') {
    
    const syncTargets = await Sync.getTranslations(shop);
    let isLeft = true;
    if (syncTargets && (syncTargets.length > 0)) {
      for (let i=0; i<syncTargets.length; i++) {
        const target = syncTargets[i];
        console.log(target);
        if (target.resourceType == 'PRODUCT') {
          //
          await syncProductTranslations(shop, admin, target.resourceId.split('/').pop(), false);

        } else {
          //
          await syncOtherTranslations (shop, admin, target.resourceId.split('/').pop(), target.resourceType, false);
          // await syncCollectionTranslations(shop, admin, target.resourceId.split('/').pop(), false);
          
        }

        // Flag as translate synced on DB
        await Sync.modifyTranslations({
          ...target,
          status: 1,
        });

      }
    } else {
      isLeft = false;
    }

    result = { isLeft };
  }

  return { ...result, input:data, action:data.action };
  // return Response.json({ ...result, input:data, action:data.action });
}