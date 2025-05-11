import { Box, Text } from "@shopify/polaris";

interface TranslationProgressBarProps {
  confirmedCount: number;
  needsAttentionCount: number;
  notTranslatedCount: number;
  total: number;
}

export function TranslationProgressBar({
  confirmedCount,
  needsAttentionCount,
  notTranslatedCount,
  total
}: TranslationProgressBarProps) {
  // Calculate percentages
  const confirmedPercent = total === 0 ? 0 : Math.round((confirmedCount / total) * 100);
  const needsAttentionPercent = total === 0 ? 0 : Math.round((needsAttentionCount / total) * 100);
  const notTranslatedPercent = total === 0 ? 0 : 100 - confirmedPercent - needsAttentionPercent;

  return (
    <Box paddingInlineEnd="400" width="300px">
      <div style={{ marginBottom: "10px" }}>
        <Text
          as="p"
          variant="bodyMd"
          fontWeight="bold"
        >
          Translation Progress
        </Text>
      </div>

      <div
        style={{
          width: "100%",
          height: "8px",
          backgroundColor: "#e1e3e5",
          borderRadius: "6px",
          overflow: "hidden",
          display: "flex",
        }}
      >
        {total === 0 ? (
          <div style={{ width: "100%", height: "100%", backgroundColor: "#e1e3e5" }}></div>
        ) : (
          <>
            {notTranslatedCount > 0 && (
              <div
                style={{
                  height: "100%",
                  width: `${notTranslatedPercent}%`,
                  backgroundColor: "#ef4d30", // Bright red
                }}
              ></div>
            )}
            {needsAttentionCount > 0 && (
              <div
                style={{
                  height: "100%",
                  width: `${needsAttentionPercent}%`,
                  backgroundColor: "#FFB800", // Yellow
                }}
              ></div>
            )}
            {confirmedCount > 0 && (
              <div
                style={{
                  height: "100%",
                  width: `${confirmedPercent}%`,
                  backgroundColor: "#29845A", // Dark green
                }}
              ></div>
            )}
          </>
        )}
      </div>
    </Box>
  );
} 