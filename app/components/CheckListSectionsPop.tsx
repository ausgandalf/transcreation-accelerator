import {useState, useCallback, ReactNode, useEffect} from 'react';
import {
  Text,
  Button,
  BlockStack,
  Box,
  ChoiceList,
  ActionList,
  Popover,
  OptionList,
  InlineStack,
} from "@shopify/polaris";

import { OptionDescriptor } from '@shopify/polaris/build/ts/src/types';

interface CheckListSectionsPop {
  label: string|ReactNode,
  sections: [],
  checked?: {},
  suffix?: ReactNode,
  onChange: Function,
}

export const CheckListSectionsPop = ({label, sections, checked, onChange, suffix} : CheckListSectionsPop ) => {

  const [popActive, setPopActive] = useState(false);
  const [selected, setSelected] = useState(checked);

  useEffect(() => {
    setSelected(checked);
  }, [checked]);

  const togglePopActive = useCallback(() => {
    setPopActive((active) => !active);
    document.body.classList.toggle('resource-panel--open', !popActive);
  }, [popActive]);
  const popActiveActivator = (
    <BlockStack gap="200">
      <a onClick={togglePopActive}>
        {(typeof label == 'string') ? (
          <InlineStack wrap={false} gap='050'>
            <span style={{whiteSpace:"nowrap"}}>{label}</span>
            {suffix}
          </InlineStack>
        ) : (
          <InlineStack>
            {label}
          </InlineStack>
        )}
      </a>
    </BlockStack>
  );

  return (
    <Popover
      active={popActive}
      activator={popActiveActivator}
      autofocusTarget="first-node"
      onClose={togglePopActive}
      >
        <Box padding='200'>
          <BlockStack gap='200'>
            {sections.map((section, i) => (
              <Box key={'pop-section-' + i}>
                <BlockStack gap="100">
                  <Text as='h6' variant='bodyMd' fontWeight='semibold'>{section.title}</Text>
                  <BlockStack gap='100' inlineAlign='start'>
                    <ChoiceList
                      title={section.title}
                      titleHidden
                      choices={section.choices}
                      selected={selected[section.key] ? selected[section.key] : []}
                      onChange={(values: string[]) => {
                        const newSelected = {...selected, ...{[section.key]:values}};
                        setSelected(newSelected);
                        onChange(values, section.key);
                      }}
                      allowMultiple={section.multiple}
                    />
                    {section.hasClear && (
                      <Button variant='plain' onClick={() => {
                        // TODO
                        const newSelected = {...selected, ...{[section.key]:[]}};
                        setSelected(newSelected);
                        onChange([], section.key);
                      }}>Clear</Button>
                    )}
                  </BlockStack>
                </BlockStack>
              </Box>
            ))}
          </BlockStack>
        </Box>
    </Popover>
  )
}