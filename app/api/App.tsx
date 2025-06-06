export async function getActiveThemeId(graphql) {

  const response = await graphql(`
  query getMainThemeId {
    themes(first: 1, roles: [MAIN]) {
      nodes {
        id
      }
    }
  }`);
  
  // const themeId = response.data.themes.nodes[0].id;
  const {
    data: { themes },
  } = await response.json();

  let themeId = '-';
  if (themes.nodes && (themes.nodes.length > 0)) {
    themeId = themes.nodes[0].id;
    themeId = themeId.split('/').slice(-1)[0];
  }
  return themeId;
}

export async function getShopLocales(graphql) {

  const response = await graphql(`
  query getShopLocales {
    shopLocales {
      locale
      name
      primary
      published
    }
  }`);
  
  const {
    data: { shopLocales },
  } = await response.json();

  return shopLocales;
}


export async function getShopMarkets(graphql) {

  const response = await graphql(`
  query getMarkets {
    markets(first:100) {
      nodes {
        handle
        name
        id
        webPresences (first: 100) {
          nodes {
            id
           	rootUrls {
              url
            	locale
          	} 
          }
        }
      }
    }
  }`);
 
  const {
    data: { markets },
  } = await response.json();

  return markets.nodes.map((x, i) => ({
    id: x.id,
    handle: x.handle,
    name: x.name,
    locales: x.webPresences.nodes[0].rootUrls, // ??? is this always existing here???
  }));
}


export async function getProducts(graphql, cursor?:string, status?:string, limit:number = 12) {
  const first = `first: ${limit}`;
  const start = cursor ? `after:"${cursor}"` : '';
  const search = `query:"${status ? 'status:' + status : ''}"`;

  const productParams = [first, start, search].filter((x) => x != '').join(',');

  const response = await graphql(`
  query getProducts {
    productsCount(${search}) {
      count
    }
    products(${productParams}) {
      nodes {
        id
        handle
        title
        image:featuredMedia {
          preview {
            image {
              url
            }
          }
        }
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }`);
 
  const {
    data: { products, productsCount },
  } = await response.json();

  return {products, total: productsCount.count};
}

export async function getProductsWithOptions (graphql, cursor?:string, limit:number = 50) {
  const first = `first: ${limit}`;
  const start = cursor ? `after:"${cursor}"` : '';
  const productParams = [first, start].filter((x) => x != '').join(',');

  const response = await graphql(`
  query getProducts {
    products(${productParams}) {
      nodes {
        id
        handle
        options {
          id
          name
          optionValues {
            id
            name
          }
        }
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }`);
 
  const {
    data: { products },
  } = await response.json();

  return { products };
}

export async function getProductInfo(graphql, id:string) {

  const response = await graphql(`
  query getProductInfo {
    product(id: "${id}") {
      id
      handle
      title
      image:featuredMedia {
        preview {
          image {
            url
          }
        }
      }
    }
  }`);
 
  const {
    data: { product },
  } = await response.json();

  return product;
}


export async function getProduct(graphql, id:string) {

  const response = await graphql(`
  query getProduct {
    product(id: "${id}") {
      hasOnlyDefaultVariant,
      id,
      options {
        id
        name
        optionValues {
          id
          name
        }
      }
    }
  }`);
 
  const {
    data: { product },
  } = await response.json();

  return product;
}


export async function getCollections(graphql, cursor?:string, limit:number = 12) {

  const start = cursor ? `,after:"${cursor}"` : '';

  const response = await graphql(`
  query getCollections {
    collectionsCount {
      count
    }
    collections(first: ${limit} ${start}) {
      nodes {
        id
        handle
        title
        image {
          url
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
      }
    }
  }`);
 
  const {
    data: { collections, collectionsCount },
  } = await response.json();

  return {collections, total: collectionsCount.count};
}

export async function getTranslations(graphql, id:string, locale:string) {

  const response = await graphql(`
  query getTranslations{
    translatableResource(resourceId: "${id}") {
      resourceId
      translatableContent {
        key
        value
        digest
        locale
      }
      translations(locale: "${locale}") {
        key
        value
      }
    }
  }`);
 
  const {
    data: { translatableResource },
  } = await response.json();

  return {transdata: translatableResource};
}

export async function getTranslationsByIds(graphql, ids:string, locale:string, market:string = '') {
  const marketFilter = market ? `, marketId: "${market}"` : `, marketId: null`;
  const response = await graphql(`
  query getTranslationsByIds{
    translatableResourcesByIds(first:100, resourceIds: ${ids}) {
      nodes {
        resourceId
        translatableContent {
          key
          value
          digest
          locale
          type
        }
        translations(locale: "${locale}" ${marketFilter}) {
          key
          value
          updatedAt
        }
      }
    }
  }`);
 
  const {
    data: { translatableResourcesByIds : {nodes} },
  } = await response.json();

  return {transdata: nodes};
}

export async function setTranslations (graphql, id:string, translations:[], market:string = '') {
  
  if (market) {
    for (let i=0; i<translations.length; i++) {
      translations[i]['marketId'] = market;
    }
  }
  const response = await graphql(
    `#graphql
    mutation translationsRegister($resourceId: ID!, $translations: [TranslationInput!]!) {
      translationsRegister(resourceId: $resourceId, translations: $translations) {
        userErrors {
          message
          field
        }
        translations {
          key
          value
          updatedAt
        }
      }
    }`,
    {
      variables: {
        "resourceId": id,
        "translations": translations, /*[
          {
            "locale": "fr",
            "key": "title",
            "value": "L'élément",
            "translatableContentDigest": "4e5b548d6d61f0006840aca106f7464a4b59e5a854317d5b57861b8423901bf6"
          }
        ]*/
      },
    },
  );

  const {
    data: { translationsRegister },
  } = await response.json();

  return {result: {...translationsRegister, id}};
}

export async function deleteTranslations (graphql, id:string, keys:[string], locale:string, market:string =  '') {
  
  let variables = {
    "resourceId": id,
    "locales": [
      locale
    ],
    "translationKeys": keys,
    "marketIds": []
  };
  if (market) {
    variables.marketIds.push(market);
  }

  const response = await graphql(
    `mutation translationsRemove($resourceId: ID!, $translationKeys: [String!]!, $locales: [String!]!, $marketIds: [ID!]!) {
      translationsRemove(resourceId: $resourceId, translationKeys: $translationKeys, locales: $locales, marketIds:$marketIds) {
        userErrors {
          message
          field
        }
        translations {
          key
          value
        }
      }
    }`,
    {
      variables
    },
  );

  const {
    data: { translationsRemove },
  } = await response.json();

  return {result: translationsRemove};
}

export async function getImages(graphql, isNext:number = 1, cursor?:string, limit:number = 12, name:string = '') {
  const searchs = [
    (isNext == 1) ? `first: ${limit}` : `last: ${limit}`,
    cursor ? ((isNext == 1) ? `after:"${cursor}"` : `before:"${cursor}"`) : '',
    (name != '') ? `query:"filename:'${name}' AND media_type:image"` : `query:"media_type:image"`, 
    `sortKey:UPDATED_AT`,
    `reverse:true`,
  ]
  const params = searchs.filter((x) => x != '').join(',');

  const response = await graphql(`
  query getFiles {
    files (
      ${params}
    ) {
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      nodes {
        id
        fileStatus
        preview {
          image {
            id
            url
          }
        }
      }
    }
  }`);
 
  const {
    data: { files },
  } = await response.json();

  return {files};
}


export async function getImageURL(graphql, id:string) {
  const response = await graphql(`
  query getFileInfo {
    node(id: "${id}") {
      id
      ... on MediaImage {
        fileStatus
        image {
          url
        }
      }
    }
  }`);
 
  const {
    data: { node },
  } = await response.json();

  return node;
}

export async function getImageUploadEndpoint(graphql, filename:string, filesize:string, mimeType:string) {
  const variables = {
    input: [
      {
        resource: "IMAGE",
        filename: filename, // "uploaded-image.jpg",
        mimeType: mimeType, // "image/jpeg",
        fileSize: filesize,
        httpMethod: "POST"
      },
    ],
  }
  const response = await graphql(`
  mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
    stagedUploadsCreate(input: $input) {
      stagedTargets {
        url
        resourceUrl
        parameters {
          name
          value
        }
      }
    }
  }`, {
    variables
  });
 
  const {
    data: { stagedUploadsCreate : { stagedTargets } },
  } = await response.json();

  return {target: stagedTargets[0]};
}

export async function createImageOnStore(graphql, uploadedUrl:string) {
  const variables = {
    files: [
      {
        originalSource: uploadedUrl,
        contentType: "IMAGE",
      },
    ],
  }
  const response = await graphql(`
  mutation fileCreate($files: [FileCreateInput!]!) {
    fileCreate(files: $files) {
      files {
        preview {
          image {
            url
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
  `, {
    variables
  });
 
  const {
    data: { fileCreate : { files } },
  } = await response.json();

  return {url: files[0]};
}
