import { useState, useEffect } from 'react';
import { useFetcher } from "@remix-run/react";

import {
  Button,
  Tooltip,
  Text,
  BlockStack,
} from "@shopify/polaris";

type SyncProcessResponse = {
  action?: string;
  hasNext?: boolean;
  input?: { force?: string | number };
};

type SyncDoResponse = {
  action?: string;
  isLeft?: boolean;
};

interface SyncRunnerProps {
  asButton?: boolean,
}

const defaultProps: SyncRunnerProps = {
  asButton: false,
}

export const SyncRunner = (props:SyncRunnerProps) => {
  
  props = {...defaultProps, ...props}
  const { asButton } = props;
  
  const [syncHasNext, setSyncHasNext] = useState(false);
  const [isSyncPoolLeft, setIsSyncPoolLeft] = useState(false);

  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////
  
  const fetcher = useFetcher<SyncProcessResponse>();
  const transFetcher = useFetcher<SyncDoResponse>();

  useEffect(() => {
    console.log("[SyncRunner] fetcher.state:", fetcher.state, "fetcher.data:", fetcher.data);
  }, [fetcher.state, fetcher.data]);

  useEffect(() => {
    console.log(
      "[SyncRunner] transFetcher.state:",
      transFetcher.state,
      "transFetcher.data:",
      transFetcher.data,
    );
  }, [transFetcher.state, transFetcher.data]);
  
  useEffect(() => {
    // console.log(fetcher);
    if (!fetcher.data) {
    } else {
      if (fetcher.data.action == 'sync_process') {
        // TODO
        setSyncHasNext(!!fetcher.data.hasNext);
        if (fetcher.data.hasNext) syncPooling();
        if (fetcher.data.input?.force == '1') syncDoing();
      }
    }
  }, [fetcher.data]);

  useEffect(() => {
    // console.log(transFetcher);
    if (!transFetcher.data) {
    } else {
      if (transFetcher.data.action == 'sync_do') {
        // TODO
        setIsSyncPoolLeft(!!transFetcher.data.isLeft);
        if (transFetcher.data.isLeft) syncDoing();
      }
    }
  }, [transFetcher.data]);

  const toFormData = (obj: Record<string, unknown>) => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined || value === null) continue;
      formData.append(key, String(value));
    }
    return formData;
  };

  const syncPooling = () => {
    const data = {
      action: 'sync_process',
    };
    console.log('sync starting...', data);
    setSyncHasNext(true);
    fetcher.submit(toFormData(data), { action: "/api", method: "post" });
  };

  const syncPoolingRestart = () => {
    const data = {
      force: 1,
      action: 'sync_process',
    };
    console.log('sync restart clicked...', data);
    setSyncHasNext(true);
    fetcher.submit(toFormData(data), { action: "/api", method: "post" });
  };

  const syncDoing = () => {
    const data = {
      action: 'sync_do',
    };
    // console.log('sync doing...', data);
    setIsSyncPoolLeft(true);
    transFetcher.submit(toFormData(data), { action: "/api", method: "post" });
  };

  useEffect(() => {
    syncPooling();
    syncDoing();
  }, [])
  
  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////

  const buttonTooltip = () => (syncHasNext || isSyncPoolLeft) ? `Syncing the search index...` : `Some translations not showing up? Re-sync the search index — it might take long!`;
  return (
    <div>
      {asButton && (
        <BlockStack gap="200">
          <Text as="p" variant="bodySm" tone="subdued">
            Scheduler: {fetcher.state} <br /> Syncer: {transFetcher.state}
          </Text>
          <Tooltip content={buttonTooltip()}>
            <Button
              loading={syncHasNext || isSyncPoolLeft}
              onClick={() => {
                console.log("SyncRunner button onClick fired");
                syncPoolingRestart();
                console.log("[SyncRunner] after submit, fetcher.state:", fetcher.state);
              }}
            >
              Re-sync
            </Button>
          </Tooltip>
        </BlockStack>
      )}
    </div>
  );
}
