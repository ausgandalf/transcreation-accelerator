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

export const Skeleton = () => {
  return (
        <SkeletonPage>

          <Layout>
            <Layout.Section variant="oneThird">
              <BlockStack gap="400">
                <Card>
                  <BlockStack gap="400">
                    <InlineStack gap="200" wrap={false} align="start">
                      <Box width='90px'>
                        <SkeletonThumbnail size="large" />
                      </Box>
                      <Box width='100%'>
                        <BlockStack gap="400">
                          <SkeletonDisplayText size="large" />
                          <SkeletonBodyText lines={2} />
                        </BlockStack>
                      </Box>
                    </InlineStack>
                  </BlockStack>
                </Card>

                <Card>
                  <BlockStack gap="400">
                    <InlineStack wrap={false} align="start" gap="200">
                      <Box width='20px'>
                        <SkeletonThumbnail size="extraSmall" />
                      </Box>
                      <Box width='100%'>
                        <BlockStack gap="100">
                          <SkeletonDisplayText size="large" />
                          <SkeletonBodyText lines={2} />
                        </BlockStack>
                      </Box>
                    </InlineStack>
                    <SkeletonDisplayText size="medium" />
                    <SkeletonBodyText lines={1} />
                  </BlockStack>
                </Card>

                <Card>
                  <BlockStack gap="400">
                    <InlineStack wrap={false} align="start" gap="200">
                      <Box width='20px'>
                        <SkeletonThumbnail size="extraSmall" />
                      </Box>
                      <Box width='100%'>
                        <BlockStack gap="400">
                          <SkeletonDisplayText size="medium" />
                          <SkeletonBodyText lines={1} />
                        </BlockStack>
                      </Box>
                    </InlineStack>
                      
                    <InlineGrid columns={4} gap="100">
                      <SkeletonDisplayText size="small" />
                      <SkeletonDisplayText size="small" />
                      <SkeletonDisplayText size="small" />
                      <SkeletonDisplayText size="small" />
                    </InlineGrid>
                    
                    <InlineGrid alignItems="center" columns={2} gap="200">
                      <BlockStack gap="200">
                        <BlockStack gap="100">
                          <SkeletonDisplayText size="extraLarge" />
                          <SkeletonBodyText lines={1} />
                        </BlockStack>

                        <BlockStack gap="100">
                          <SkeletonDisplayText size="extraLarge" />
                          <SkeletonBodyText lines={1} />
                        </BlockStack>
                      </BlockStack>

                      <BlockStack gap="200">
                        <BlockStack gap="100">
                          <SkeletonDisplayText size="extraLarge" />
                          <SkeletonBodyText lines={1} />
                        </BlockStack>
                        
                        <BlockStack gap="100">
                          <SkeletonDisplayText size="extraLarge" />
                          <SkeletonBodyText lines={1} />
                        </BlockStack>
                      </BlockStack>
                    </InlineGrid>
                  </BlockStack>
                </Card>
              </BlockStack>
            </Layout.Section>

            <Layout.Section>
              <Card>
                <BlockStack gap="400">
                  
                  <InlineStack wrap={false} align="start" gap="200">
                    <Box width="20px">
                      <SkeletonThumbnail size="extraSmall" />
                    </Box>
                    
                    <Box width='100%'>
                      <BlockStack gap="100">
                        <SkeletonDisplayText size="large" />
                        <SkeletonBodyText lines={2} />
                      </BlockStack>
                    </Box>
                  </InlineStack>
                  
                  <BlockStack gap="400">
                    {[...Array(4)].map((x, i) =>
                      <BlockStack gap="400" key={'block-' + i}>
                        <SkeletonDisplayText size="large" />
                        <SkeletonBodyText lines={4} />
                      </BlockStack>
                    )}
                  </BlockStack>

                </BlockStack>
              </Card>
            </Layout.Section>
          </Layout>

        </SkeletonPage >
    );
}
