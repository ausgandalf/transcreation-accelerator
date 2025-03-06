import {useState, useEffect, useCallback} from 'react';
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData, useNavigation } from "@remix-run/react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { Redirect } from "@shopify/app-bridge/actions";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  Page,
  Layout,
  BlockStack,
  Box,
  Button,
  Card,
  Icon,
  InlineStack,
  Text,
  Badge,
  Tooltip,
} from "@shopify/polaris";
import {
  ChevronDownIcon,
  QuestionCircleIcon,
} from '@shopify/polaris-icons';

import polarisTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate, login } from "../../shopify.server";

import styles from "./styles.module.css";
import appStyles from "../../res/style.css?url";

import { SelectPop } from 'app/components/SelectPop';
import { LoadingScreen } from 'app/components/LoadingScreen';
import { getRedirect } from 'app/components/Functions';
import { getshopLocales } from 'app/api/App';

import { Skeleton } from './skeleton';
import { ResourceList } from './list';

export const links = () => [
  { rel: "stylesheet", href: polarisStyles },
  { rel: "stylesheet", href: appStyles }
];

export const loader = async ({ request }: LoaderFunctionArgs) => {

  const { admin, session } = await authenticate.admin(request);
  
  let locales = [];
  let endLoop = false;
  while (!endLoop) {
    try {
      locales = await getshopLocales(admin.graphql);
      endLoop = true;
    } catch (e) {}
  }
  
  let defaultLocale = {locale: 'en', name: 'English', primary: true, published: true};
  let currentLocale = (locales.length > 0) ? locales[0] : defaultLocale;
  

  const url = new URL(request.url);
  if (url.searchParams.get("shopLocale")) {
    const localeCode = url.searchParams.get("shopLocale");
    locales.map((x, i) => {
      if (x.locale == localeCode) {
        currentLocale = x;
      }
      if (x.primary) {
        defaultLocale = x
      }
    });
  } else {
    throw redirect(`/?${url.searchParams.toString()}&shopLocale=${currentLocale.locale}`);
  }



  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    locales,
    currentLocale,
    defaultLocale,
    init: true, 
    path: '/', 
    translation: polarisTranslations, 
    shop: url.searchParams.get("shop")
  };
};

export default function App() {
  
  const shopify = useAppBridge();
  
  const { apiKey, locales, currentLocale, defaultLocale, init, path, translation, shop } = useLoaderData<typeof loader>();
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState(currentLocale);

  const nav = useNavigation();
  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "save";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";

  useEffect(() => {
    setIsLoading(nav.state === "loading");
  }, [nav.state])

  const renderLocales = useCallback(() => {
    if (!locales) return;
    if (locales.length == 1) {
      return (<Text as='p' variant='headingLg'>{locales[0].name}</Text>);
    } else {
      // TODO

      return (<SelectPop 
        label={selectedLocale.name} 
        suffix={<Icon source={ChevronDownIcon}/>}
        items={locales.map(
          (x, i) => ({
            content: x.name,
            active: x.locale == selectedLocale.locale,
            onAction: () => {
              // Redirect
              if (x.locale != selectedLocale.locale) {
                setIsLoading(true);
                getRedirect(shopify).dispatch(
                  Redirect.Action.APP,
                  `/?shopLocale=${x.locale}`,
                )
              }
            }
          })
        )} />);
    }
  }, [locales])

  useEffect(() => {
    if (init) {
      setTimeout(() => setIsLoaded(true), 1000);
    }
  }, [init]);

  const gotoLanguageSettingsPage = () => {
    getRedirect(shopify).dispatch(
      Redirect.Action.ADMIN_PATH,
      `/settings/languages`  
    );
  };

  const openQuickGuide = () => {}

  const tooltip = (tip: string) => {
    return <Tooltip content={tip}><Icon source={QuestionCircleIcon} /></Tooltip>
  }

  const sections = [
    {
      title: 'Products',
      items: [
        {content: 'Collections', url: '#'},
        {content: 'Products', url:  '#'},
      ],
    },
    {
      title: 'Online Store',
      items: [
        {content: 'Blog posts', url: '#'},
        // {content: 'Blog titles', url:  '#', suffix: tooltip('Default translations already available in supported languges')},
        {content: 'Blog titles', url:  '#'},
        {content: 'Cookie banner', url:  '#'},
        {content: 'Filters', url:  '#'},
        {content: 'Metaobjects', url:  '#'},
        {content: 'Pages', url:  '#'},
        {content: 'Policies', url:  '#'},
        {content: 'Store metadata', url:  '#'},
      ],
    },
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
    },
  ]

  return (
    <AppProvider i18n={translation} isEmbeddedApp apiKey={apiKey}>
      {!init || !isLoaded ? (
        <Skeleton />
      ) : (
        <Page
          title="Localized content:"
          titleMetadata={renderLocales()}
          secondaryActions={[{
            content: 'View Store',
            disabled: shop && (shop != '') ? false : true,
            onAction: () => {
              getRedirect(shopify).dispatch(
                Redirect.Action.REMOTE,
                {
                  url: `https://${shop}`,
                  newContext: true,
                }
              )
            },
          }]}
        >
          {isLoading && (<LoadingScreen />)}
          <Layout>
            <Layout.Section>
              <BlockStack gap='600'>
                <Card padding='0'>
                  <ResourceList sections={sections} />
                </Card>
                <Box></Box>
              </BlockStack>
            </Layout.Section>
            
            <Layout.Section variant='oneThird'>

              <BlockStack gap='400'>

                <Card>
                  <BlockStack gap='200'>
                    <InlineStack gap='100'>
                      <Text as='h2' variant='headingSm'>{selectedLocale.name}</Text>
                      {selectedLocale.primary && (
                        <Badge>Default</Badge>
                      )}
                      {!selectedLocale.published && (
                        <Badge>Unpublished</Badge>
                      )}
                    </InlineStack>
                    
                    { selectedLocale.primary && (
                      <Text as='p' variant='bodySm'>Your default language is visible to all customers. Versions customized for markets are only visible to customers in those markets.</Text>
                    )}
                    
                    { !selectedLocale.published && (
                      <Text as='p' variant='bodySm'>Translations aren’t visible to customers until the language is published.</Text>
                    )}

                    <InlineStack gap='100'>
                      <Button variant='plain' onClick={gotoLanguageSettingsPage}>Manage</Button>
                    </InlineStack>
                  </BlockStack>
                </Card>

                <Card>
                  <BlockStack gap='200'>
                    <InlineStack gap='100'>
                      <Text as='h2' variant='headingSm'>Get started guide
                      </Text>
                    </InlineStack>
                    
                    <Text as='p' variant='bodySm'>Learn all about content localization with our quick start guide.</Text>

                    <InlineStack gap='100'>
                      <Button variant='plain' onClick={openQuickGuide}>Quick start guide</Button>
                    </InlineStack>
                  </BlockStack>
                </Card>

              </BlockStack>

            </Layout.Section>
            
          </Layout>
        </Page>
      )}
    </AppProvider>
  );
}
