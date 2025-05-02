import { tooltip } from "app/components/Functions"

export const sections = [
  {
    title: 'Products',
    items: [
      {content: 'Collections', url: '/localize/collection'},
      {content: 'Products', url:  '/localize/product'},
    ],
  },
  {
    title: 'Online Store',
    items: [
      {content: 'Blog posts', url: '/localize/article'},
      {content: 'Blog titles', url:  '/localize/blog'},
      // {content: 'Cookie banner', url:  '#', suffix: tooltip('Default translations already available in supported languges')},
      {content: 'Filters', url:  '/localize/filter'},
      {content: 'Metaobjects', url:  '/localize/metaobject'},
      {content: 'Pages', url:  '/localize/page'},
      {content: 'Policies', url:  '/localize/policy'},
      // {content: 'Store metadata', url:  '#'},
    ],
  },
  {
    title: 'Content',
    items: [
      // {content: 'Menu', url: '#'},
    ],
  },
  {
    title: 'Theme',
    items: [
      {content: 'App embeds', url: '/localize/embed'},
      {content: 'Default theme content', url: '/localize/content'},
      {content: 'Section groups', url: '/localize/section'},
      {content: 'Static sections', url: '/localize/static'},
      {content: 'Templates', url: '/localize/template'},
      {content: 'Theme settings', url: '/localize/theme'},
    ],
  },
  {
    title: 'Settings',
    items: [
      // {content: 'Notifications', url: '#'},
      // {content: 'Shipping and delivery', url: '#'},
    ],
  },
]

export const guideData = [
  {
    image: ``,
    heading: `Localize everywhere`,
    title: `Localize right from where you create content, across Shopify`,
    content: `Access the editor by finding Localize under More actions for any resources like products or collections, and in your Online Store sections. You can also access the editor by selecting a resource from the app home page.`,
  },
  {
    image: ``,
    heading: `Side-by-side editor`,
    title: `Translate your content into other languages`,
    content: `When adding new languages to your store, you'll be able to easily add, edit and review translations for each language with the editor.`,
  },
  {
    image: ``,
    heading: `Store content by market`,
    title: `Customize your content for different markets`,
    content: `Account for spelling, vocabulary, and messaging variations to provide a shopping experience tailored for different markets. When viewing translations, switch between markets to add a customized version.`,
  },
  {
    image: ``,
    heading: `Auto-translate`,
    title: `Automatically translate your store`,
    content: `Use the free automatic translation option for up to 2 languages to quickly translate your store content, and manually translate up to 20 languages. Whenever you add any new content in your default language, remember to run automatic translation again, or manually add new translations.`,
  },
  {
    image: ``,
    heading: `Edit and review`,
    title: `Everything in one place`,
    content: `Move between all of your store's translatable and customizable content. Polish up and publish for your customers, wherever they are.`,
  }
]

export const transKeys = {
  'body_html': {
    label: 'Description',
    type: 'html',
  },
  'handle': {
    label: 'URL handle',
    type: 'text',
  }
}

export const resourceTypePath = {
  'PRODUCT': 'product',
  'PRODUCT_OPTION': 'product',
  'PRODUCT_OPTION_VALUE': 'product',
  'COLLECTION': 'collection',
  'BLOG': 'blog',
  'ARTICLE': 'article',
  'PAGE': 'page',
  'FILTER': 'filter',
  'SHOP_POLICY': 'policy',
  'METAOBJECT': 'metaobject',
  'ONLINE_STORE_THEME_JSON_TEMPLATE': 'template',
  'ONLINE_STORE_THEME_SETTINGS_CATEGORY': 'theme',
  'ONLINE_STORE_THEME_SECTION_GROUP': 'section',
  'ONLINE_STORE_THEME_SETTINGS_DATA_SECTIONS': 'static',
  'ONLINE_STORE_THEME_LOCALE_CONTENT': 'content',
  'ONLINE_STORE_THEME_APP_EMBED': 'embed',
}

export const syncTypes = (() => {
  const types = Object.keys(resourceTypePath);
  return types.filter(x => (['PRODUCT_OPTION', 'PRODUCT_OPTION_VALUE'].indexOf(x) < 0));
})();

export const availablePathes = (() => {
  const pathes = [];
  for (let key in resourceTypePath) {
    const section = resourceTypePath[key];
    if (pathes.indexOf(section) < 0) pathes.push(section);
  }
  return pathes;
})();

export const getResourceTypesPerSection = () => {
  const types = {};
  for (let key in resourceTypePath) {
    const section = resourceTypePath[key];
    if (!types[section]) types[section] = [];
    types[section].push(key);
  }
  return types;
}


export const commonReadActions = (() => {
  const actions = {};
  for (let key in resourceTypePath) {
    const section = resourceTypePath[key];
    if (!(section + '_read' in actions)) actions[section + '_read'] = key;
  }

  delete actions['product_read'];
  return actions;
})();

export const readActions = {
  ...commonReadActions,
  'product_read' : 'PRODUCT',
}

export const emptyStateInfo = {
  'article': ['Add blog post', '/content/articles'],
  'blog': ['Add blog', '/content/blogs'],
  'product': ['Add product', '/products'],
  'collection': ['Add collection', '/collections'],
  'page': ['Add page', '/content/articles'],
  'field': ['Add a field', '/online_store/preferences'],
  'metaobject': ['Add metaobject', '/content/metaobjects'],
  'theme': ['Add a field', '/themes/${themeId}/editor'],
  'template': ['Add a field', '/themes/${themeId}/editor'],
  'static': ['Add a field', '/themes/${themeId}/editor'],
  'section': ['Add a field', '/themes/${themeId}/editor'],
  'content': ['Add a field', '/themes/${themeId}/language'],
  'embed': ['Add app embed', '/themes'],
}