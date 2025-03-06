import {
  Card,
  BlockStack,
  Box,
  Grid,
  InlineStack,
  Layout,
  SkeletonPage,
  SkeletonDisplayText,
  SkeletonBodyText,
  SkeletonThumbnail,
  Divider,
  InlineGrid,
} from "@shopify/polaris";

import { ResourceListSkeleton } from './list';

export const Skeleton = () => {
  return (
        <SkeletonPage>

          <Layout>
            <Layout.Section>
              <Card padding='0'>
                <ResourceListSkeleton />
              </Card>
            </Layout.Section>

            <Layout.Section variant="oneThird">
              
              <BlockStack gap='400'>
                <Card>
                  <BlockStack gap='200'>
                    <SkeletonDisplayText size="small" />
                    <SkeletonBodyText lines={3} />
                    <SkeletonDisplayText size="small" />
                  </BlockStack>
                </Card>

                <Card>
                  <BlockStack gap='200'>
                    <SkeletonDisplayText size="small" />
                    <SkeletonBodyText lines={2} />
                    <SkeletonDisplayText size="small" />
                  </BlockStack>
                </Card>
              </BlockStack>

            </Layout.Section>
          </Layout>

        </SkeletonPage >
    );
}
