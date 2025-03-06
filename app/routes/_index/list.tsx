import {
  ActionList, 
  Thumbnail, 
  Icon, 
  Avatar,
  Box,
  InlineCode,
  InlineStack,
  Text,
  BlockStack,
  Divider,
  Button,
  SkeletonDisplayText,
  SkeletonBodyText,
} from '@shopify/polaris';
import {ChevronRightIcon} from '@shopify/polaris-icons';

interface ResourceListProps {
  sections?: [];
}

const defaultProps: ResourceListProps = {
  sections: [
    {
      title: 'Products',
      items: [
        {content: 'Collections', url: '#'},
        {content: 'Products', url:  '#'},
      ],
    },
  ],
}

export const ResourceList = (props: ResourceListProps) => {

  props = {...defaultProps, ...props}
  const { sections } = props;

  return (
    <Box>
      {sections.map((x, i) => (
        <BlockStack key={`block-${i}`}>
          <Divider />
          <Box paddingInline='400' paddingBlock='300' background='bg-fill-active'>
            <Text as='h5'  variant='headingSm'>{x.title}</Text>
          </Box>
          <BlockStack>
            {x.items.map((item, j) => (
              <BlockStack key={`block-${i}-${j}`}>
                <Divider />
                <a href={item.url} className='resourceLink'>
                  <Box padding='400'>
                    <InlineStack align='space-between'>
                      <InlineStack gap='100' blockAlign='center'>
                        <Text as='h6' variant='headingSm' fontWeight='regular'>{item.content}</Text>
                        {item.suffix}
                      </InlineStack>
                      <Box maxWidth='25px'>
                        <Icon source={ChevronRightIcon} />
                      </Box>
                    </InlineStack>
                  </Box>
                </a>
              </BlockStack>
            ))}
          </BlockStack>
        </BlockStack>
      ))}
    </Box>
    );
}

interface ResourceListSkeletonProps {
  blocks?: Array<number>;
}

const defaultSkeletonProps: ResourceListSkeletonProps = {
  blocks: [2, 8, 1, 6, 2],
}

export const ResourceListSkeleton = (props:ResourceListSkeletonProps) => {
  props = {...defaultSkeletonProps, ...props}
  const { blocks } = props;
  return (
    <Box>
      {blocks.map((x, i) => (
        <BlockStack key={`block-${i}`}>
          <Box paddingInline='400' paddingBlock='300' background='bg-fill-active'>
            <Box width='140px'><SkeletonBodyText lines={1} /></Box>
          </Box>
          <BlockStack>
            {[...Array(x)].map((item, j) => (
              <BlockStack key={`block-${i}-${j}`}>
                <Divider />
                <Box padding='400'>
                  <InlineStack align='space-between'>
                    <Box width='140px'><SkeletonBodyText lines={1} /></Box>
                    <Box maxWidth='25px'>
                      <Icon source={ChevronRightIcon} />
                    </Box>
                  </InlineStack>
                </Box>
              </BlockStack>
            ))}
          </BlockStack>
        </BlockStack>
      ))}
    </Box>
    );
}
