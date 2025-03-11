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
  
  // const themeId = response.data.themes.nodes[0].id;
  const {
    data: { shopLocales },
  } = await response.json();

  return shopLocales;
}


export async function getShopMarkets(graphql) {

  const response = await graphql(`
  query Markets {
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

