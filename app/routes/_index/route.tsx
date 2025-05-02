import {useState, useEffect, useCallback} from 'react';
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData, useNavigate, useNavigation, useSearchParams } from "@remix-run/react";
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
} from "@shopify/polaris";
import {
  ChevronDownIcon,
} from '@shopify/polaris-icons';

import polarisTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate, login } from "../../shopify.server";

import styles from "./styles.module.css";
import appStyles from "../../res/style.css?url";

import { SyncRunner } from "app/components/SyncRunner";
import { SelectPop } from 'app/components/SelectPop';
import { LoadingScreen } from 'app/components/LoadingScreen';
import { getRedirect } from 'app/components/Functions';
import { getShopLocales } from 'app/api/GraphQL';

import { Skeleton } from './skeleton';
import { ResourceList } from './list';
import { GuideModal } from './modal';

import { sections, guideData } from 'app/api/data';

export const links = () => [
  { rel: "stylesheet", href: polarisStyles },
  { rel: "stylesheet", href: appStyles }
];

export const loader = async ({ request }: LoaderFunctionArgs) => {

  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;

  let locales = [];
  let endLoop = false;
  while (!endLoop) {
    try {
      locales = await getShopLocales(admin.graphql);
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
    shop,
  };
};

export default function App() {
  
  const shopify = useAppBridge();
  
  const navigate = useNavigate();

  const { apiKey, locales, currentLocale, defaultLocale, init, path, translation, shop } = useLoaderData<typeof loader>();
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocale, setSelectedLocale] = useState(currentLocale);
  // const [searchParams, setSearchParams] = useSearchParams();

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
        items={locales.map(
          (x, i) => ({
            content: x.name,
            active: x.locale == selectedLocale.locale,
            onAction: () => {
              // Redirect
              if (x.locale != selectedLocale.locale) {
                setIsLoading(true);
                navigate(`/?shopLocale=${x.locale}`);
                
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

  const openQuickGuide = () => {
    document.getElementById('guide-modal').show();
  }

  const goto = (path:string) => {
    setIsLoading(true);
    navigate(`${path}?shopLocale=${selectedLocale.locale}`);

    // getRedirect(shopify).dispatch(
    //   Redirect.Action.APP,
    //   `${path}?shopLocale=${selectedLocale.locale}`,
    // )
  }

  return (
    <AppProvider i18n={translation} isEmbeddedApp apiKey={apiKey}>
      {!init || !isLoaded ? (
        <Skeleton />
      ) : (
        <Page
          title="Localized content:"
          titleMetadata={renderLocales()}
          primaryAction = {{
            content: 'Auto-translate',
            onAction: () => {
              // TODO - Auto translation logic will be planted.
            }
          }}
          secondaryActions={
            <InlineStack gap="100">
              <SyncRunner asButton />

              <Button 
                // disabled={shop && (shop != '') ? false : true} 
                onClick={() => {
                  // getRedirect(shopify).dispatch(
                  //   Redirect.Action.REMOTE,
                  //   {
                  //     url: `https://${shop}`,
                  //     newContext: true,
                  //   }
                  // )
                }}
              >View store</Button>
            </InlineStack>
          }
          // secondaryActions={[
          //   {
          //     content: 'View Store',
          //     disabled: shop && (shop != '') ? false : true,
          //     onAction: () => {
          //       getRedirect(shopify).dispatch(
          //         Redirect.Action.REMOTE,
          //         {
          //           url: `https://${shop}`,
          //           newContext: true,
          //         }
          //       )
          //     },
          //   }
          // ]}
        >
          {isLoading && (<LoadingScreen />)}
          <Layout>
            <Layout.Section>
              <BlockStack gap='600'>
                <Card padding='0'>
                  <ResourceList sections={sections} goto={goto} />
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

      <GuideModal steps={guideData} />

    </AppProvider>
  );
}
