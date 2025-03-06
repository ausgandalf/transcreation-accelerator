import {useState, useCallback, ReactNode} from 'react';
import {
  Text,
  Button,
  BlockStack,
  ActionList,
  Popover,
  OptionList,
  InlineStack,
} from "@shopify/polaris";

import { ActionListItemDescriptor } from '@shopify/polaris/build/ts/src/types';

interface SelectPopProps {
    label: string,
    items: ActionListItemDescriptor[],
    suffix?: ReactNode,
}

export const SelectPop = ({label, items, suffix} : SelectPopProps ) => {

    const [popActive, setPopActive] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);

    const togglePopActive = useCallback(() => setPopActive((active) => !active), []);
    const popActiveActivator = (
        <BlockStack gap="200">
            <Button variant='tertiary' onClick={togglePopActive}>
                <InlineStack wrap={false} gap='050'>
                    <Text as='p' variant='headingLg'><span style={{whiteSpace:"nowrap"}}>{label}</span></Text>
                    {suffix}
                </InlineStack>
            </Button>
        </BlockStack>
    );
    
    return (
        <Popover
            active={popActive}
            activator={popActiveActivator}
            autofocusTarget="first-node"
            onClose={togglePopActive}
            >
            <ActionList
                actionRole="menuitem"
                items={items}
            />
        </Popover>
    )
}