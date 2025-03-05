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
  InlineStack,
  Text,
  Badge,
} from "@shopify/polaris";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { authenticate, login } from "../../shopify.server";

import styles from "./styles.module.css";
import appStyles from "../../res/style.css?url";

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
  
  const url = new URL(request.url);

  // if (url.searchParams.get("shop")) {
  //   throw redirect(`/app?${url.searchParams.toString()}`);
  // }
  
  const locales = await getshopLocales(admin.graphql);

  return {
    apiKey: process.env.SHOPIFY_API_KEY || "",
    locales,
    init: true, 
    path: '/', 
    translation: polarisTranslations, 
    shop: url.searchParams.get("shop")
  };
};

export default function App() {
  
  const shopify = useAppBridge();

  const { apiKey, locales, init, path, translation, shop } = useLoaderData<typeof loader>();
  const [isLoaded, setIsLoaded] = useState(false);

  const nav = useNavigation();
  const isSaving =
    nav.state === "submitting" && nav.formData?.get("action") !== "save";
  const isDeleting =
    nav.state === "submitting" && nav.formData?.get("action") === "delete";
  const isLoading = nav.state === "loading";

  const renderLocales = useCallback(() => {
    if (!locales) return;
    if (locales.length == 1) {
      return (<Text as='p' variant='headingLg'>{locales[0].name}</Text>);
    } else {
      // TODO
      return;
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
              <Card padding='0'>
                <ResourceList />
              </Card>
            </Layout.Section>
            <Layout.Section variant='oneThird'>

              <BlockStack gap='400'>

                <Card>
                  <BlockStack gap='200'>
                    <InlineStack gap='100'>
                      <Text as='h2' variant='headingSm'>English</Text>
                      <Badge>Default</Badge>
                    </InlineStack>
                    
                    <Text as='p' variant='bodySm'>Your default language is visible to all customers. Versions customized for markets are only visible to customers in those markets.</Text>

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
