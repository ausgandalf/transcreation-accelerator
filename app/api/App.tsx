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

export async function getshopLocales(graphql) {

  const response = await graphql(`
  query getshopLocales {
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

