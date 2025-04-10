import { useState, useEffect } from 'react';
import { useFetcher } from "@remix-run/react";

import {
  Button,
  Tooltip,
} from "@shopify/polaris";

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
  
  const fetcher = useFetcher();
  const transFetcher = useFetcher();
  
  useEffect(() => {
    // console.log(fetcher);
    if (!fetcher.data) {
    } else {
      if (fetcher.data.action == 'sync_process') {
        // TODO
        setSyncHasNext(fetcher.data.hasNext);
        if (fetcher.data.hasNext) syncPooling();
        if (fetcher.data.input.force == '1') syncDoing();
      }
    }
  }, [fetcher.data]);

  useEffect(() => {
    // console.log(transFetcher);
    if (!transFetcher.data) {
    } else {
      if (transFetcher.data.action == 'sync_do') {
        // TODO
        setIsSyncPoolLeft(transFetcher.data.isLeft);
        if (transFetcher.data.isLeft) syncDoing();
      }
    }
  }, [transFetcher.data]);

  const syncPooling = () => {
    const data = {
      action: 'sync_process',
    };
    // console.log('sync starting...', data);
    setSyncHasNext(true);
    fetcher.submit(data, { action: "/api", method: "post" });
  };

  const syncPoolingRestart = () => {
    const data = {
      force: 1,
      action: 'sync_process',
    };
    // console.log('sync starting...', data);
    setSyncHasNext(true);
    fetcher.submit(data, { action: "/api", method: "post" });
  };

  const syncDoing = () => {
    const data = {
      action: 'sync_do',
    };
    // console.log('sync doing...', data);
    setIsSyncPoolLeft(true);
    transFetcher.submit(data, { action: "/api", method: "post" });
  };

  useEffect(() => {
    syncPooling();
    syncDoing();
  }, [])
  
  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////

  const buttonTooltip = () => (syncHasNext || isSyncPoolLeft) ? `Syncing the search index...` : `Not seeing some translations in your search results? Give the search index a quick re-sync!`;
  return (
    <div>
      {asButton && (
        <Tooltip active={syncHasNext || isSyncPoolLeft} content={buttonTooltip()}>
          <Button loading={syncHasNext || isSyncPoolLeft} onClick={syncPoolingRestart}>Re-sync for Search</Button>
        </Tooltip>
      )}
    </div>
  );
}
