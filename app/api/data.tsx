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
      // {content: 'Filters', url:  '#'},
      // {content: 'Metaobjects', url:  '#'},
      // {content: 'Pages', url:  '#'},
      // {content: 'Policies', url:  '#'},
      // {content: 'Store metadata', url:  '#'},
    ],
  },/*
  {
    title: 'Content',
    items: [
      {content: 'Menu', url: '#'},
    ],
  },
  {
    title: 'Theme',
    items: [
      {content: 'App embeds', url: '#'},
      {content: 'Default theme content', url: '#'},
      {content: 'Section groups', url: '#'},
      {content: 'Static sections', url: '#'},
      {content: 'Templates', url: '#'},
      {content: 'Theme settings', url: '#'},
    ],
  },
  {
    title: 'Settings',
    items: [
      {content: 'Notifications', url: '#'},
      {content: 'Shipping and delivery', url: '#'},
    ],
  },*/
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
}

export const getResourceTypesPerSection = () => {
  const types = {};
  for (let key in resourceTypePath) {
    const section = resourceTypePath[key];
    if (!types[section]) types[section] = [];
    types[section].push(key);
  }
  return types;
}