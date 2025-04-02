import {useState, useEffect, useReducer, useMemo, useCallback, useRef} from 'react';
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useOutletContext, useLoaderData, useNavigate, useNavigation, useFetcher, useActionData, useSubmit, useSearchParams } from "@remix-run/react";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { Redirect, Fullscreen } from "@shopify/app-bridge/actions";
import { useAppBridge, SaveBar } from "@shopify/app-bridge-react";

import {
  Page,
  Layout,
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Card,
  Icon,
  InlineStack,
  Text,
  Badge,
  Tooltip,
  FullscreenBar,
  Pagination,
  Divider,
  Thumbnail,
  TextField,
} from "@shopify/polaris";
import {
  ImageIcon,
  ExternalIcon,
} from '@shopify/polaris-icons';

import { authenticate, login } from "../../shopify.server";

import { FillParents } from './fill_parents';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {

  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);

  const action = params.action;

  return {
    init: true, 
    path: `/translation/${action}`,
    action,
  };
};

export default function App() {
  
  const shopify = useAppBridge();
  const { action } = useLoaderData();

  return (
    <Layout>
      <Layout.Section>

        <Box padding="400">
          {(action == 'fill-parent') && (
            <FillParents />
          )}
        </Box>
      
      </Layout.Section>
    </Layout>
  );
}
