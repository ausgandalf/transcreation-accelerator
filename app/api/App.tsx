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
    markets(first:50) {
      nodes {
        handle
        name
        webPresence {
          rootUrls {
            locale
            url
          }
        }
      }
    }
  }`);
 
  const {
    data: { markets },
  } = await response.json();

  return markets.nodes.map((x, i) => ({
    handle: x.handle,
    name: x.name,
    locales: x.webPresence.rootUrls,
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


export async function getCollections(graphql, cursor?:string, limit:number = 12) {

  const start = cursor ? `,after:"${cursor}"` : '';

  const response = await graphql(`
  query getCollections {
    collections(first: ${limit} ${start}) {
      nodes {
        id
        handle
        title
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
      }
    }
  }`);
 
  const {
    data: { collections },
  } = await response.json();

  return collections;
}

