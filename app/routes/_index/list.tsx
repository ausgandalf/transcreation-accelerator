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
} from '@shopify/polaris';
import {ChevronRightIcon} from '@shopify/polaris-icons';


export const ResourceList = () => {

  const sections = [
    {
      title: 'Products',
      items: [
        {content: 'Collections', url: '#'},
        {content: 'Products', url:  '#'},
      ],
    },
  ];

  return (
    <Box>
      {sections.map((x, i) => (
        <BlockStack>
          <Box paddingInline='400' paddingBlock='300' background='bg-fill-active'>
            <Text as='h5'  variant='headingSm'>{x.title}</Text>
          </Box>
          <BlockStack>
            {x.items.map((item, j) => (
              <BlockStack>
                <Divider />
                <a href={item.url} className='resourceLink'>
                  <Box padding='400'>
                    <InlineStack align='space-between'>
                      <Text as='h6' variant='headingSm' fontWeight='regular'>{item.content}</Text>
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
