// Client-safe versions of TranslationState functions
export type TranslationStatus =
  | "in_progress"
  | "confirmed"
  | "needs_attention"
  | "not_translated";
export type ResourceType = "product" | "option" | "option_value";

// Get translation state by id, key, locale, market
export const getTranslationState = async (
  shop: string,
  resourceId: string,
  field: string,
  locale: string,
  market: string,
) => {
  const params = new URLSearchParams({
    intent: "get",
    shop,
    resourceId,
    field,
    locale,
    market: market || "",
  });

  try {
    const response = await fetch(`/api/translation-state?${params}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting translation state:", error);
    return null;
  }
};

// Get all translation states for a resource
export const getTranslationStateByResourceId = async (
  shop: string,
  resourceId: string,
  locale: string,
  market: string,
) => {
  const params = new URLSearchParams({
    intent: "getByResourceId",
    shop,
    resourceId,
    locale,
    market: market || "",
  });

  try {
    const response = await fetch(`/api/translation-state?${params}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error getting translation states for resource:", error);
    return [];
  }
};

// Get all translation states for a product and its related options/values
// This also works for non-product resources by treating them as their own parent
export const getTranslationStateByParentProductId = async (
  shop: string,
  parentProductId: string,
  locale: string,
  market: string,
) => {
  const params = new URLSearchParams({
    intent: "getByParentProductId",
    shop,
    parentProductId,
    locale,
    market: market || "",
  });

  try {
    const response = await fetch(`/api/translation-state?${params}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(
      "Error getting translation states for resource family:",
      error,
    );
    return [];
  }
};

// Update translation state
export const updateTranslationState = async (
  shop: string,
  resourceId: string,
  field: string,
  locale: string,
  market: string,
  data: { status?: TranslationStatus; previousValue?: string },
  resourceType: ResourceType = "product",
  parentProductId?: string,
) => {
  const formData = new FormData();
  formData.append("intent", "upsert");
  formData.append("shop", shop);
  formData.append("resourceId", resourceId);
  formData.append("field", field);
  formData.append("locale", locale);
  formData.append("market", market || "");
  formData.append("resourceType", resourceType);

  // If parent product ID is not provided, use resource ID for products
  const productId =
    parentProductId || (resourceType === "product" ? resourceId : "");
  formData.append("parentProductId", productId);

  if (data.status) formData.append("status", data.status);
  if (data.previousValue) formData.append("previousValue", data.previousValue);

  try {
    const response = await fetch("/api/translation-state", {
      method: "POST",
      body: formData,
    });
    return await response.json();
  } catch (error) {
    console.error("Error updating translation state:", error);
    return null;
  }
};

// Delete translation state
export const deleteTranslationState = async (
  shop: string,
  resourceId: string,
  field: string,
  locale: string,
  market: string,
) => {
  const formData = new FormData();
  formData.append("intent", "delete");
  formData.append("shop", shop);
  formData.append("resourceId", resourceId);
  formData.append("field", field);
  formData.append("locale", locale);
  formData.append("market", market || "");

  try {
    const response = await fetch("/api/translation-state", {
      method: "POST",
      body: formData,
    });
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error("Error deleting translation state:", error);
    return false;
  }
};
