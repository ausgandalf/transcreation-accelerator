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
  Grid,
} from '@shopify/polaris';
import {ChevronRightIcon, HeartIcon} from '@shopify/polaris-icons';
import {Modal, TitleBar, useAppBridge} from '@shopify/app-bridge-react';

import { useEffect, useState } from 'react';

interface GuideModalProps {
  step?: number,
  steps?: Array<any>;
  update?: Function,
}

const defaultProps: GuideModalProps = {
  update: (page:number) => {},
  step: 0,
  steps: [
    {
      image: ``,
      heading: `Localize everywhere`,
      title: `Localize right from where you create content, across Shopify`,
      content: `Access the editor by finding Localize under More actions for any resources like products or collections, and in your Online Store sections. You can also access the editor by selecting a resource from the app home page.`,
    },
  ],
}

export const GuideModal = (props: GuideModalProps) => {

  props = {...defaultProps, ...props}
  const { step, steps, update } = props;

  const [page, setPage] = useState(step);

  const nextPage = () => {
    const newPage = Math.min(steps.length, page + 1);
    setPage(newPage);
    update(newPage);
  }

  const previousPage = () => {
    const newPage = Math.max(0, page - 1);
    setPage(newPage);
    update(newPage);
  }

  return (
    <Modal id="guide-modal" onShow={() => setPage(0)}>
      <BlockStack gap="0">
        <Box padding="600">
          <BlockStack gap="200">
            <Text as='h5' variant='bodySm' fontWeight='medium' tone='success' alignment='center'>{steps?steps[page].heading : ''}</Text>
            <Text as='h2' variant='headingLg' alignment='center'>{steps?steps[page].title : ''}</Text>
            <div style={{height:'60px'}}>
              <Text as='p' variant='bodySm' alignment='center'>{steps?steps[page].content : ''}</Text>
            </div>
          </BlockStack>
        </Box>

        <Box padding="400">
          <Grid columns={{xs:3}}>
            <Grid.Cell>
              {(page > 0) && (
                <Button variant='secondary' onClick={previousPage}>Previous</Button>
              )}
            </Grid.Cell>
            <Grid.Cell>
              <div style={{display: 'flex', height: '100%', justifyContent: 'center'}}>
                <BlockStack inlineAlign='center' align='center'>
                  <Text as='p' variant='bodySm' alignment='center'>{page + 1} of {steps?.length}</Text>                
                </BlockStack>
              </div>
            </Grid.Cell>
            <Grid.Cell>
              <InlineStack align='end'>
                {(page < steps.length - 1) && (
                  <Button variant='primary' onClick={nextPage}>Next</Button>
                )}
                {(page == steps.length - 1) && (
                  <Button variant='primary' onClick={() => {document.getElementById('guide-modal').hide();}}>Close</Button>
                )}
              </InlineStack>
            </Grid.Cell>
          </Grid>
        </Box>

      </BlockStack>
      <TitleBar title='Get started with AI Transcreation'></TitleBar>
    </Modal>
  );
}
