import {
  Card,
  BlockStack,
  Box,
  Button,
  Grid,
  InlineStack,
  Layout,
  SkeletonPage,
  SkeletonDisplayText,
  SkeletonBodyText,
  SkeletonThumbnail,
  Divider,
  InlineGrid,
  Text,
  Thumbnail,
} from "@shopify/polaris";
import {
  FilterIcon,
  ImageIcon,
} from '@shopify/polaris-icons';

import { thStyle, cellStyle, sourceCellStyle, targetCellStyle } from "app/res/style";
import { makeReadable } from "./Functions";

export const SkeletonResources = () => {
  return (
    <BlockStack>
      {[...Array(10)].map((x, i) => (
      <Box key={'skeleton-resource-item-' + i}>
        <div 
          style={{
            padding: '10px 20px',
          }}>
          <InlineStack gap='100' wrap={false} blockAlign="center">
          <Box minWidth="24px"><SkeletonThumbnail size="extraSmall" /></Box>
            <Box minWidth="calc(100% - 24px)"><SkeletonBodyText lines={1}/></Box>
          </InlineStack>
        </div>
      </Box>
    ))}
    </BlockStack>
  );
}


export interface SkeletonTranslationProp {
  section? : string
}
export const defaultSkeletonTranslationProp:SkeletonTranslationProp = {
  section: 'product'
}

export const SkeletonTranslation = (prop : SkeletonTranslationProp) => {
  prop = {...defaultSkeletonTranslationProp, ...prop};
  const { section } = prop;

  return (
    <BlockStack gap='400'>
      <InlineStack align='space-between' blockAlign='center'>
        <InlineStack gap='200'>
          <Box maxWidth="40px">
            <Thumbnail
              source={ImageIcon}
              size="small"
              alt='Product Thumbnail'
            />
          </Box>
          <Text as='h2' variant='headingLg'>{ makeReadable(section) }</Text>
        </InlineStack>
        <Box minWidth="100px">
          <SkeletonDisplayText size="small" />
        </Box>
      </InlineStack>

      <SkeletonTranslationContent section={section} />

    </BlockStack>
  );
}

export const SkeletonTranslationContent = (prop : SkeletonTranslationProp) => {
  prop = {...defaultSkeletonTranslationProp, ...prop};
  const { section } = prop;

  return (
    <div>

      {(section == 'product') && (
        <BlockStack gap='400'>
          <Card padding='0'>
            <table width='100%' cellSpacing='0' cellPadding='0'>
              <thead>
                <tr><th colSpan={3} style={{padding:'var(--p-space-600) var(--p-space-400)'}}><Text as="p" variant="headingMd" alignment="start">Product</Text></th></tr>
                <tr>
                  {[...Array(3)].map((x, i) => (
                    <th key={'skeleton-mainth--' + i} style={thStyle}><Box><SkeletonDisplayText size="small" /></Box></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((x, i) => (
                  <tr key={'skeleton-maintr--' + i}>
                    {[...Array(3)].map((y, j) => (
                      <td key={'skeleton-maintr-th--' + j} width='33%' style={cellStyle}><Box><SkeletonBodyText lines={1}/></Box></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card padding='0'>
            <table width='100%' cellSpacing='0' cellPadding='0'>
              <thead>
                <tr><th colSpan={3} style={{padding:'var(--p-space-600) var(--p-space-400)'}}><Text as="p" variant="headingMd" alignment="start">Product options</Text></th></tr>
                <tr>
                  {[...Array(3)].map((x, i) => (
                    <th key={'skeleton-optth--' + i} style={thStyle}><Box><SkeletonDisplayText size="small" /></Box></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(2)].map((x, i) => (
                  <tr key={'skeleton-opttr--' + i}>
                    {[...Array(3)].map((y, j) => (
                      <td key={'skeleton-opttr-th--' + j} width='33%' style={{
                        borderTop: '1px solid var(--p-color-border-secondary)',
                        padding: 'var(--p-space-300) var(--p-space-300)',
                      }}><Box><SkeletonBodyText lines={1}/></Box></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

        </BlockStack>
      )}

      {(section != 'product') && (
        <BlockStack gap='400'>
          <Card padding='0'>
            <table width='100%' cellSpacing='0' cellPadding='0'>
              <thead>
                <tr><th colSpan={3} style={{padding:'var(--p-space-600) var(--p-space-400)'}}><Text as="p" variant="headingMd" alignment="start">{makeReadable(section)}</Text></th></tr>
                <tr>
                  {[...Array(3)].map((x, i) => (
                    <th key={'skeleton-mainth--' + i} style={thStyle}><Box><SkeletonDisplayText size="small" /></Box></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((x, i) => (
                  <tr key={'skeleton-maintr--' + i}>
                    {[...Array(3)].map((y, j) => (
                      <td key={'skeleton-maintr-th--' + j} width='33%' style={cellStyle}><Box><SkeletonBodyText lines={1}/></Box></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </BlockStack>
      )}


    </div>
  );
}

export const SkeletonLocalize = (prop : SkeletonTranslationProp) => {
  prop = {...defaultSkeletonTranslationProp, ...prop};
  const { section } = prop;

  return (
    <Box minHeight='100%'>

      <Box>
        <div style={{background:'#ffffff', height:'56px', display:'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}}>
          <Box width="100px" paddingInlineStart='600'>
            <SkeletonDisplayText />
          </Box>
          <Box width="300px">
            <SkeletonBodyText lines={1} />
          </Box>
          <Box width="160px">
            <SkeletonDisplayText />
          </Box>
        </div>
      </Box>
      
      <div className='fullscreenLayout withTopBar'>
        <div className='layout layout--translate'>
          <div>
            <div style={{background:'#fff',height:'100%',overflow:'auto',position:'relative'}}>
                <Box padding='200'>
                  <InlineStack align='space-between' blockAlign='center'>
                    <Text as='p'>Showing 0 of 0 Items</Text>
                    <Button icon={FilterIcon} accessibilityLabel='Filter' />
                  </InlineStack>
                </Box>

                <Divider/>

                <div style={{
                  height: 'calc(100% - 50px',
                  overflow:'auto',
                }}>
                  <SkeletonResources />
                </div>
              
            </div>
          </div>
          
          <div>
            <Box padding='400'>
              <SkeletonTranslation section={section} />
            </Box>
          </div>  
        </div>
      </div>

    </Box>
    );
}

