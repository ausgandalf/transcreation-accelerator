import type { LoaderFunctionArgs } from "@remix-run/node";
import { authenticate } from "../../shopify.server";
import { Translations } from "app/models/Translations";
import { resourceTypePath } from "app/api/data";
import { getIDBySection } from "app/components/Functions";

import { 
  getProducts, 
  getProductsWithOptions,
  getProduct, 
  getProductInfo,
  getCollections,
  getTranslationsByIds, 
  setTranslations, 
  deleteTranslations,
  getImages, 
  getImageUploadEndpoint,
  createImageOnStore,
  getImageURL,
} from 'app/api/App';

import { sleep } from "app/components/Functions";

export const loader = async ({ request }: LoaderFunctionArgs) => {

  const { admin, session } = await authenticate.admin(request);

  const url = new URL(request.url);
  const action = url.searchParams.get("q");

  let result:any = {};

  return Response.json({ msg:'Welcome!' });
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

    result['product'] = product; // Put product info
    
  } else if (data.action == 'collection_list') {
    // Load collection list
    let endLoop = false;
    while (!endLoop) {
      try {
        result = await getCollections(admin.graphql, data.cursor, data.perPage);
        endLoop = true;
      } catch (e) {}
    }
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
    let results = [...Array(translationsObj.length)];
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
    const q = data.q;
    const page = parseInt(data.page);
    const perPage = parseInt(data.perPage);
    const {total, rows} = await Translations.find(q, resourceTypes, isNaN(page) ? 0 : page, isNaN(perPage) ? 10 : perPage);

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

      const objId = getIDBySection(x.parentId ? x.parentId : x.resourceId, 'product');
      // console.log(x);
      // console.log(objId);
      if (!(objId in refined)) {
        refined[objId] = {
          info: {},
          items: []
        };
      }
      refined[objId].items.push({...x, parentId:objId, highlight:v, path:resourceTypePath[x.resourceType]});
    });

    // console.log('trans-refined:', refined);

    for (let key in refined) {
      let endLoop = false;
      let product = null;
      while (!endLoop) {
        try {
          product = await getProductInfo(admin.graphql, key);
          endLoop = true;
        } catch (e) {}
      }

      refined[key].info = product;
    }
    // console.log('product-info-filled-up:', refined);
    result['result'] = {total, result: refined};

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
    
  }

  return Response.json({ ...result, input:data, action:data.action });
}