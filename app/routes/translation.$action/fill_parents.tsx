import { useState, useEffect } from 'react';
import { useFetcher } from "@remix-run/react";

import {
  BlockStack,
  Box,
  Button,
  InlineStack,
  Text,
  Pagination,
  Divider,
  Thumbnail,
  Card,
  Layout,
} from "@shopify/polaris";
import {
  FilterIcon,
  ImageIcon,
} from '@shopify/polaris-icons';

import { LoadingScreen } from 'app/components/LoadingScreen';
import { isSaveBarOpen } from 'app/components/Functions';
import { CheckListPop } from 'app/components/CheckListPop';

import { SkeletonResources } from '../../components/Skeletons';

interface FillParentsProps {
  cursor?: string,
}

const defaultProps: FillParentsProps = {
  cursor: '',
}

export const FillParents = (props:FillParentsProps) => {
  
  props = {...defaultProps, ...props}
  const { cursor } = props;
  
  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////
  
  const fetcher = useFetcher();
  
  const perPage = 50; // Let's keep this fixed for now

  const [currentCursour, setCurrentCursour] = useState(cursor);
  const [page, setPage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false)
  
  useEffect(() => {
    console.log(fetcher);
    if (!fetcher.data) {
    } else {
      if (fetcher.data.action == 'trans_fill_parents') {
        const {cursor, hasNext} = fetcher.data.pageInfo;

        setCurrentCursour(cursor);
        setPage((prevPage) => (prevPage + 1));
        if (hasNext) {
          fixNext(cursor);
        } else {
          setIsProcessing(false);
        }
      }
    }
  }, [fetcher.data]);

  const fixNext = async (cursor: string = '') => {
    const data = {
      cursor,
      perPage,
      action: 'trans_fill_parents',
    };
    console.log(data);
    fetcher.submit(data, { action: "/api", method: "post" });
    console.log(fetcher);
  };
  
  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////

  return (
    <Card>

      <BlockStack gap="400">
        <Box>
          <Button onClick={() => {
            setPage(0);
            setIsProcessing(true);
            fixNext();
          }}>Start Fixing Translations Table</Button>
        </Box>

        <Box>
          <BlockStack gap="200">
            {isProcessing && (
              <Text as='p'>Processing...</Text>
            )}
            <Text as='p'>Processed {page * perPage} products so far.</Text>
          </BlockStack>
        </Box>

      </BlockStack>

    </Card>
  );
}
