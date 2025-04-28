import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import { TranslationRow, Translations } from "app/models/Translations";
import { SyncTranslationsRow, SyncProcessRow, Sync } from "app/models/Sync";
import { syncProductTranslations, syncCollectionTranslations, syncOtherTranslations, doSyncProcess } from "app/api/Actions";
import { resourceTypePath } from "app/api/data";
import { getIDBySection } from "app/components/Functions";

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
} from 'app/api/GraphQL';

import { sleep, getResourceInfo } from "app/components/Functions";

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
    
  } else if (data.action == 'collection_list') {
    // Load collection list
    let endLoop = false;
    while (!endLoop) {
      try {
        result = await getCollections(admin.graphql, data.cursor, data.perPage);
        endLoop = true;
      } catch (e) {}
    }
  } else if (data.action == 'collection_read') {
    
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
    result['idTypes'] = {[data.id]:'COLLECTION'};
    result['resource'] = {id: data.id};
    
  } else if (data.action == 'blog_list') {
    // Load blog list
    let endLoop = false;
    while (!endLoop) {
      try {
        result = await getBlogs(admin.graphql, data.cursor, data.perPage);
        endLoop = true;
      } catch (e) {}
    }
  } else if (data.action == 'blog_read') {
    
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
    result['idTypes'] = {[data.id]:'BLOG'};
    result['resource'] = {id: data.id};
    
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

  } else if (data.action == 'article_read') {
    
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
    result['idTypes'] = {[data.id]:'ARTICLE'};
    result['resource'] = {id: data.id};
    
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

  } else if (data.action == 'page_read') {
    
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
    result['idTypes'] = {[data.id]:'PAGE'};
    result['resource'] = {id: data.id};
    
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

        dataset.push({
          shop,
          resourceType: translationsObj[i].type,
          resourceId: translationsObj[i].id.split('/').pop(),
          parentId: data.id.split('/').pop(),
          field: fieldValue,
          locale: data.locale,
          market: data.marketLabel,
          content: originObj[data.id][fieldValue]['value'],
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
      const objId = getIDBySection(x.parentId ? x.parentId : x.resourceId, _path);
      // console.log(x);
      // console.log(objId);
      if (!(objId in refined)) {
        refined[objId] = {
          _path,
          info: {},
          items: []
        };
      }
      refined[objId].items.push({...x, parentId:objId, highlight:v, _path});
    });

    // console.log('trans-refined:', refined);

    for (let key in refined) {
      // Get resource info via GraphQL, 
      // (-- but let's skip to reduce GraphQL api interaction..., instead, we will get the title from DB --)
      // refined[key].info = await getResourceInfo(admin.graphql, key, refined[key]._path);

      // Get the title from DB, to reduce GraphQL usage rate
      refined[key].info = {
        id: key,
        title: await Translations.getTitle(shop, key.split('/').pop())
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
    const jobs = ['PRODUCT', 'COLLECTION', 'BLOG', 'ARTICLE', 'PAGE'];

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