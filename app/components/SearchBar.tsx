import { useState } from "react";
import { InlineStack, Box, Button, TextField } from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";

interface SearchBarProps {
  onSearch: (searchKey: string) => void;
  onToggleVisibility: (isVisible: boolean) => void;
  isVisible: boolean;
  selectors?: React.ReactNode;
}

export function SearchBar({ 
  onSearch, 
  onToggleVisibility, 
  isVisible, 
  selectors 
}: SearchBarProps) {
  const [searchKey, setSearchKey] = useState("");

  const handleSearch = (value: string) => {
    setSearchKey(value);
    onSearch(value);
  };

  return (
    <InlineStack gap="100" align="center" blockAlign="center" wrap={false}>
      {!isVisible && selectors}
      
      {isVisible && (
        <div style={{ flex: "0 0 calc(100% - 200px)" }}>
          <TextField
            label="Search by keyword"
            labelHidden
            focused
            placeholder="Search by keyword"
            minLength={100}
            value={searchKey}
            onChange={handleSearch}
            autoComplete="off"
          />
        </div>
      )}
      
      <Box>
        {!isVisible && (
          <Button
            icon={SearchIcon}
            onClick={() => onToggleVisibility(true)}
          />
        )}
        
        {isVisible && (
          <Button onClick={() => {
            setSearchKey("");
            onToggleVisibility(false);
            onSearch("");
          }}>
            Cancel
          </Button>
        )}
      </Box>
    </InlineStack>
  );
} 