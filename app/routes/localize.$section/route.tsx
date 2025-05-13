import { useState, useEffect, useReducer, useCallback, useRef } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  useOutletContext,
  useLoaderData,
  useNavigate,
  useFetcher,
  useSearchParams,
} from "@remix-run/react";
import { Redirect, Fullscreen } from "@shopify/app-bridge/actions";
import { useAppBridge, SaveBar } from "@shopify/app-bridge-react";
import {
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Card,
  Icon,
  InlineStack,
  Text,
  Badge,
  FullscreenBar,
  Thumbnail,
  TextField,
  Checkbox,
  EmptyState,
} from "@shopify/polaris";
import {
  ImageIcon,
  ExternalIcon,
  SearchIcon,
  LayoutBlockIcon,
  CheckIcon,
  UndoIcon,
  XIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../../shopify.server";
import { LoadingScreen } from "app/components/LoadingScreen";
import { SyncRunner } from "app/components/SyncRunner";
import {
  extractId,
  getRedirect,
  makeReadable,
  getReadableDate,
  getIDBySection,
  isSaveBarOpen,
  makeFullscreen,
  enterFullscreen,
  exitFullscreen,
  sleep,
} from "app/components/Functions";
import { getResourceInfo } from "app/api/Actions";
import { getActiveThemeInfo, getProductInfo } from "app/api/GraphQL";
import {
  thStyle,
  cellStyle,
  sourceCellStyle,
  xtraCellStyle,
  targetCellStyle,
  textareaStyle,
} from "app/res/style";
import {
  SkeletonLocalize,
  SkeletonTranslationContent,
} from "../../components/Skeletons";

import { TransReadResponseType } from './_types';

import { ResourcePanel as ProductsPanel } from "./products";
import { ResourcePanel as CollectionsPanel } from "./collections";
import { ResourcePanel as BlogsPanel } from "./blogs";
import { ResourcePanel as ArticlesPanel } from "./articles";
import { ResourcePanel as PagesPanel } from "./pages";
import { ResourcePanel as ThemeContentPanel } from "./theme_content";
import { ResourcePanel as ResourcesPanel } from "./resources";

import { SearchPanel } from "./search";

import {
  sections,
  transKeys,
  availablePathes,
  commonReadActions,
  readActions,
  emptyStateInfo,
} from "app/api/data";
import { Editor } from "app/components/Editor";
import { InsertImageModal } from "app/components/Editor--CKEditor--InsertImageModal";
import {
  updateTranslationState,
  deleteTranslationState,
  getTranslationStateByResourceId,
  getTranslationStateByParentProductId,
  ResourceType,
} from "app/lib/translation-state-client";
import { SearchBar } from "../../components/SearchBar";
import { TranslationProgressBar } from "../../components/TranslationProgressBar";
import { ResourceHeadline } from "../../components/ResourceHeadline";

import { contentList } from 'app/api/data';

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;
  const url = new URL(request.url);

  const section = params.section;
  let selected: any = false;
  let id = url.searchParams.get("id") ? url.searchParams.get("id") : "";
  // Get id in Shopify eco-system
  id = getIDBySection(id, section);
  if (!(['notification'].includes(section)) && id) {
    // Load resource info
    selected = await getResourceInfo(shop, admin.graphql, id, section);
    if (section == 'content') {
      selected.item = url.searchParams.get("item") ?? '';
      if (selected.item) selected.title = contentList[selected.item].label;
    }
  }

  let theme = {
    rawId: "",
    id: "",
    name: "",
    prefix: "",
    themeStoreId: "",
  };
  let endLoop = false;
  while (!endLoop) {
    try {
      theme = await getActiveThemeInfo(admin.graphql);
      endLoop = true;
    } catch (e) {}
  }

  return {
    init: true,
    path: `/localize/${section}`,
    resourceId: id,
    pathSection: section,
    selected,
    shop,
    theme,
  };
};

export async function action({ request, params }) {
  const { admin, session } = await authenticate.admin(request);
  const { shop } = session;

  /** @type {any} */
  const data = {
    ...Object.fromEntries(await request.formData()),
    shop,
  };

  return { input: data };
  // return Response.json({ input: data });
}

export default function App() {
  const shopify = useAppBridge();

  const fullscreenRef = useRef<Fullscreen.Fullscreen>(0);

  const [isFullscreenMode, setIsFullscreenMode] = useState(false);

  useEffect(() => {
    if (shopify) {
      if (!isFullscreenMode) {
        const fullscreen = makeFullscreen(
          shopify,
          (data) => {
            setIsFullscreenMode(true);
          },
          (data) => {
            setIsFullscreenMode(false);
          },
        );
        fullscreenRef.current = fullscreen;
        setIsFullscreenMode(true);
      }
    }
  }, [shopify]);

  const navigate = useNavigate();

  const { init, path, resourceId, pathSection, selected, shop, theme } =
    useLoaderData<typeof loader>();
  // const actionData = useActionData<typeof action>();
  const [section, setSection] = useState(pathSection);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTranslationLoading, setIsTranslationLoading] = useState(false);
  const [isTranslationLoaded, setIsTranslationLoaded] = useState(false);

  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchKey, setSearchKey] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////

  const context = useOutletContext();
  const [currentLocale, setCurrentLocale] = useState(context.locale);
  const [currentMarket, setCurrentMarket] = useState(context.market);
  const [currentHighlight, setCurrentHighlight] = useState(context.highlight);

  useEffect(() => {
    setCurrentLocale(context.locale);
    setCurrentMarket(context.market);
    setCurrentHighlight(context.highlight);
  }, [context.locale, context.market, context.highlight]);

  useEffect(() => {
    setCurrentLocale(context.locale);
    setCurrentMarket(context.market);
  }, [context.locale, context.market]);

  function returnHome() {
    if (isSaveBarOpen()) {
      shopify.toast.show("You have unsaved changes. ", { duration: 2000 });
      shopify.saveBar.leaveConfirmation("translation-save-bar");
      return;
    }

    exitFullscreen(fullscreenRef.current);

    setIsLoading(true);
    navigate(`/?shopLocale=${currentLocale.locale}`);
  }

  function formStateReducer(state, action) {
    // console.log('reducer....', state, action);
    if (action.type === "init") {
      return structuredClone(action.translations);
    } else if (action.type === "setTraslation") {
      const id = action.id;
      const key = action.traslation.key;
      const v = action.traslation.value.trim();
      if (v == "") {
        // if (key in state[id]) delete state[id][key];  // No, this will leave current translation as is.
        action.traslation.value = v; // Let's apply trimmed value. Not sure if this is right deceision though...
        state[id][key] = { ...action.traslation };
      } else {
        state[id][key] = { ...action.traslation };
      }
      return structuredClone(state);
    }
    // console.log(state, action);
    throw Error("Unknown action in formStateReducer() found.");
  }

  const fetcher = useFetcher();

  const [prefetchedTranslations, setPrefetchedTranslations] = useState([]);

  const [selectedResource, setSelectedResource] = useState(selected);

  const [transIdTypes, setTransIdTypes] = useState({});
  const [transData, setTransData] = useState({});
  const [transDataObject, setTransDataObject] = useState({});

  const [productInfoIds, setProductInfoIds] = useState({});
  const [resourceInfo, setResourceInfo] = useState({});

  const [currentTranslateMarketLocale, setCurrentTranslateMarketLocale] =
    useState("");

  const [editors, setEditors] = useState({});

  const [formState, formStateDispatch] = useReducer(formStateReducer, {});
  const [cleanFormState, setCleanFormState] = useState({});
  const isDirty = JSON.stringify(formState) !== JSON.stringify(cleanFormState);

  useEffect(() => {
    setSection(pathSection);
    // console.log('path:', selectedResource, pathSection);
    if (selectedResource && selectedResource._path != pathSection)
      setSelectedResource(false);
  }, [pathSection]);

  useEffect(() => {
    if (isDirty) {
      shopify.saveBar.show("translation-save-bar");
    } else {
      shopify.saveBar.hide("translation-save-bar");
    }
  }, [formState, cleanFormState]);

  const updateTranslation = (
    id: string,
    key: string,
    translation: string,
    skipStatusUpdate = false,
  ) => {
    try {
      // let transObj = getTransSourceObj(transData[id], key);
      let transObj = { ...transDataObject[id][key] };
      // transObj.locale = currentLocale.locale;
      transObj.value = translation;
      transObj.translatableContentDigest = transObj.digest;
      delete transObj.digest;
      delete transObj.type;
      delete transObj.updated;

      formStateDispatch({
        type: "setTraslation",
        id: id,
        traslation: transObj,
      });

      // Update status from "confirmed" to "needs attention" when manually edited
      // Skip this when loading from saved data or when specifically requested
      if (!skipStatusUpdate) {
        const translationKey = `${id}-${key}`;

        // Only change status if currently confirmed and value is different from clean state
        if (translationStatus[translationKey] === "confirmed") {
          const cleanValue = cleanFormState[id]?.[key]?.value || "";

          // If the value has changed from what was saved, mark it as needing attention
          if (translation !== cleanValue) {
            // Update local state
            setTranslationStatus((prev) => ({
              ...prev,
              [translationKey]: null, // null status will make it show "Needs attention"
            }));
          }
        }
      }
    } catch (e) {
      // TODO
      // console.log(e);
    }
  };

  const getTranslatedValue = useCallback(
    (id: string, key: string) => {
      if (id in formState && key in formState[id]) {
        return formState[id][key].value;
      } else {
        return "";
      }
    },
    [formState],
  );

  const submitTranslations = () => {
    var translations = [];
    var transOrigin = structuredClone(transDataObject);

    for (var id in formState) {
      let trans = [];
      for (var key in formState[id]) {
        // let's only push if we have changes
        if (
          JSON.stringify(formState[id][key]) !=
          JSON.stringify(cleanFormState[id][key])
        ) {
          trans.push(formState[id][key]);
        } else {
          delete transOrigin[id][key];
        }
      }
      translations.push({
        id,
        type: transIdTypes[id] ? transIdTypes[id] : "",
        data: trans,
      });
    }

    setIsSaving(true);
    const data = {
      translations: JSON.stringify(translations),
      origin: JSON.stringify(transOrigin),
      id: selectedResource.id,
      item: selectedResource.item ?? '',
      market: currentMarket.id,
      marketLabel: currentMarket.name,
      locale: currentLocale.locale,
      action: "trans_submit",
    };
    // console.log('submitting translations ...', data);
    fetcher.submit(data, { action: "/api", method: "post" });
  };

  const onTransReadReturned = (transReadResponse: any) => {
    // console.log(selectedResource, transReadResponse);
    if (
      transReadResponse.transdata &&
      transReadResponse.resource.id == selectedResource.id
    ) {
      if (transReadResponse.action == "product_read") {
        setProductInfoIds({ ...transReadResponse.resource });
      } else {
        setResourceInfo({ ...transReadResponse.resource });
      }

      setCurrentTranslateMarketLocale(
        transReadResponse.resource.id +
          "-" +
          transReadResponse.input.locale +
          "-" +
          transReadResponse.input.market,
      );
      // Init form state
      let translatableData = {};
      let translatableDataObj = {};
      let transData = {};
      transReadResponse.transdata.map((x, i) => {
        translatableData[x.resourceId] = structuredClone(
          x.translatableContent,
        );

        translatableDataObj[x.resourceId] = {};
        x.translatableContent.map((y, j) => {
          translatableDataObj[x.resourceId][y.key] = { ...y };
        });

        transData[x.resourceId] = {};
        x.translations.map((y, j) => {
          // let obj = getTransSourceObj(x.translatableContent, y.key);
          let obj = { ...translatableDataObj[x.resourceId][y.key] };
          // obj.locale = currentLocale.locale;
          obj.value = y.value;
          obj.translatableContentDigest = obj.digest;
          delete obj.digest;
          delete obj.type;
          transData[x.resourceId][y.key] = { ...obj };

          translatableDataObj[x.resourceId][y.key]["updated"] = y.updatedAt;
        });
      });
      
      setTransData(translatableData);
      setTransDataObject(translatableDataObj);
      setTransIdTypes(transReadResponse.idTypes);

      formStateDispatch({ type: "init", translations: transData });
      setCleanFormState(transData);
      setEditors({});
      // Remove loading anim
      setIsTranslationLoading(false);
      setIsTranslationLoaded(true);
    }
  }

  useEffect(() => {
    if (!fetcher.data) {
    } else {
      if (Object.keys(readActions).includes(fetcher.data.action)) {
        // TODO
        onTransReadReturned(fetcher.data);
      } else if (fetcher.data.action == "trans_submit") {
        // TODO

        // Reloading...
        // selectResource(selectedResource);

        // Update into new data
        const newTransDataObj = structuredClone(transDataObject);

        // Clear all saving states regardless of whether there are results
        setSavingItems({});

        if (fetcher.data.results && Array.isArray(fetcher.data.results)) {
          fetcher.data.results.forEach((x, i) => {
            if (x.set && x.set.result && x.set.result) {
              // Update
              const resId = x.set.result.id;
              x.set.result.translations.map((y, j) => {
                newTransDataObj[resId][y.key]["updated"] = y.updatedAt;
                updateTranslation(resId, y.key, y.value, true);

                // Update status to confirmed in local state
                setTranslationStatus((prev) => ({
                  ...prev,
                  [`${resId}-${y.key}`]: "confirmed",
                }));
              });
            }
          });
        }
        
        setTransDataObject(newTransDataObj);

        setCleanFormState(structuredClone(formState));
        setIsSaving(false);
        setIsBulkSaving(false);
        // Clear all checked items
        setCheckedItems(new Set());
        shopify.toast.show("The translations have been saved.", {
          duration: 2000,
        });
      }
    }
  }, [fetcher.data, shop, currentLocale, currentMarket]);

  useEffect(() => {
    if (selectedResource) {
      const selectedTranslateMarketLocale =
        selectedResource.id +
        "-" +
        currentLocale.locale +
        "-" +
        currentMarket.id;
      if (currentTranslateMarketLocale != selectedTranslateMarketLocale) {
        // console.log('reload by market, locale change...');
        // console.log('curret:', currentTranslateMarketLocale, 'new:', selectedTranslateMarketLocale, selectedResource, resourceId);
        setCurrentTranslateMarketLocale(selectedTranslateMarketLocale);
        loadCurrentResource();
        // selectResource(selectedResource); // Reload translation data
      }
    }
  }, [resourceId, currentMarket, currentLocale]);

  useEffect(() => {
    if (init) {
      setTimeout(() => {
        setIsLoaded(true);
      }, 0);
    }
  }, [init]);

  const isGonnaReload = (searchParamValue = null) => {
    if (!searchParamValue) return false;
    const keys = ["id", "market", "shopLocale"];
    let gonnaReload = false;
    keys.some((x) => {
      if (searchParamValue.get(x) != searchParams.get(x)) {
        gonnaReload = true;
        return true;
      }
    });

    return gonnaReload;
  };

  const injectTransReadData = (item:any, path: string = "", fakeResponse:any = false) => {
    console.log(item, path, fakeResponse);
    if (fakeResponse) {
      onTransReadReturned(fakeResponse);
    }
  };

  const selectResource = (item, searchParamValue = null, path: string = "") => {
    // console.log(item, searchParamValue?.toString(), path, fakeResponse);
    // console.trace();
    const itemId = item.id.split("/").pop();
    item._path = path; // Set path value

    setSelectedResource(item);
    setSection(path);

    if (path && path != "" && path != section) {
      setIsTranslationLoaded(false);

      let query = "";
      if (searchParamValue) {
        if (searchParams.get("id") != itemId)
          searchParamValue.set("id", itemId);
        query = searchParamValue.toString();
      } else {
        searchParams.set("id", itemId);
        query = searchParams.toString();
      }

      const redirectUrl = `/localize/${path}?${query}`;
      // console.log(redirectUrl);
      return navigate(redirectUrl);
    } else {
      if (searchParams.get("id") != itemId || isGonnaReload(searchParamValue)) {
        setIsTranslationLoaded(false);
      }

      if (searchParamValue) {
        if (searchParams.get("id") != itemId) searchParamValue.set("id", itemId);
        setSearchParams(searchParamValue);
      } else {
        setSearchParams((prev) => {
          prev.set("id", itemId);
          return prev;
        });
      }
    }
  };

  const loadResource = (item) => {
    setIsTranslationLoading(true);
    if (!("_path" in item)) item._path = section;

    if (availablePathes.includes(item._path)) {
      const data = {
        id: item.id,
        market: currentMarket.id,
        locale: currentLocale.locale,
        action: item._path + "_read",
      };
      if (!data.market) data.market = "";
      // console.log('Read translation data...');
      fetcher.submit(data, { action: "/api", method: "post" });
    } else {
      //
      console.log("path is not available.");
    }
  };

  const loadCurrentResource = () => {
    if (section == 'content') return;
    loadResource(selectedResource); // Reload translation data
  };

  const translate = async () => {
    // Transform main product data
    const transformedData = transData[productInfoIds.id].reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    // Add options data to be translated
    const optionsData = {};
    productInfoIds.options.forEach((option) => {
      // Get option name translation data
      if (transData[option.id]) {
        optionsData[option.id] = {
          name: transDataObject[option.id].name.value,
        };
      }

      // Get option values translation data
      option.optionValues.forEach((value) => {
        if (transData[value.id]) {
          optionsData[value.id] = {
            name: transDataObject[value.id].name.value,
          };
        }
      });
    });

    const prompt = `
    The language is ${currentLocale.name}:
    ${JSON.stringify({
      product: transformedData,
      options: optionsData,
    })}
    `;

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: prompt }),
      });
      const data = await response.json();

      const translatedObject = JSON.parse(data.translatedContent);
      return translatedObject;
    } catch (error) {
      console.error("Translation error:", error);
      return {};
    }
  };

  function getLanguageLabel(locale: string) {
    let label = "";
    context.locales.some((x, i) => {
      if (x.locale == locale) {
        label = x.name;
        return true;
      }
    });
    return label;
  }

  function getKeyLabel(key: string) {
    if (key in transKeys) {
      return transKeys[key].label;
    } else {
      let refinedLabel: any = "";
      if (["template", "theme", "static", "section"].includes(section)) {
        refinedLabel = key.split(".").pop();
        refinedLabel = refinedLabel ? refinedLabel.split(":")[0] : "";
      } else if (section == 'content') {
        refinedLabel = key.replaceAll(".", ":");
        let dump = refinedLabel.split(":");
        dump.shift();
        dump = dump.slice(-2);
        refinedLabel = dump.map((d, i) => (makeReadable(d))).join(" : ");
      } else {
        refinedLabel = key.replaceAll(".", ":");
      }
      return refinedLabel ? makeReadable(refinedLabel) : makeReadable(key);
    }
  }

  const renderTransSource = (type: string, value: string) => {
    if (["HTML", "RICH_TEXT_FIELD"].includes(type)) {
      return <Editor text={value} readOnly={true} />;
      return;
    } else {
      return <Text as="p">{value}</Text>;
    }
  };

  const renderTransEditor = (type: string, id: string, key: string) => {
    let editorObj;
    if (["HTML", "RICH_TEXT_FIELD"].includes(type)) {
      editorObj = (
        <Editor
          text={getTranslatedValue(id, key)}
          key={`editor-${id}-${key}-${editorResetCount}`}
          onChange={(text: string) => updateTranslation(id, key, text)}
          onReady={(editor: any) => {
            let newEditors = { ...editors };
            newEditors[`${id}-${key}`] = editor;
            // console.log(newEditors);
            setEditors(newEditors);
          }}
        />
      );
    } else {
      editorObj = (
        <textarea
          className="text--input"
          value={getTranslatedValue(id, key)}
          onKeyDown={(e) => (e.key == "Enter" ? e.preventDefault() : "")}
          onChange={(e) => updateTranslation(id, key, e.target.value)}
          style={textareaStyle}
        ></textarea>
      );
    }

    return (
      <div>
        {editorObj}
        {transDataObject[id][key]["updated"] && (
          <div className="label--updatedAt">
            <Text as="span" variant="bodyXs">
              {"Last saved " +
                getReadableDate(new Date(transDataObject[id][key]["updated"]))}
            </Text>
          </div>
        )}

        {!transDataObject[id][key]["updated"] && (
          <div className="label--updatedAt">
            <Text as="span" variant="bodyXs">
              No translation set
            </Text>
          </div>
        )}
      </div>
    );
  };

  const renderEmptyState = (path: string) => {
    let title = "No " + makeReadable(path) + "s found.";
    if (["theme", "template"].indexOf(path) > -1) {
      title = `${theme.name} has no fields to translate`;
    } else if (["shop"].indexOf(path) > -1) {
      title = `No fields to translate`;
    }

    return (
      <EmptyState
        heading={title}
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        {Object.keys(emptyStateInfo).includes(path) && (
          <Button
            onClick={() => {
              getRedirect(shopify).dispatch(Redirect.Action.ADMIN_PATH, {
                path: emptyStateInfo[path][1].replace(
                  "${themeId}",
                  theme.rawId,
                ),
                newContext: true,
              });
            }}
          >
            {emptyStateInfo[path][0]}
          </Button>
        )}
      </EmptyState>
    );
  };

  const renderEditSection = (path: string) => {
    return (
      <div>
        {path == "product" && transData[productInfoIds.id] && (
          <BlockStack gap="400">
            <Card padding="0">
              <table
                className="table table--translate"
                width="100%"
                cellSpacing="0"
                cellPadding="0"
              >
                <thead>
                  <tr>
                    <th
                      colSpan={3}
                      style={{
                        padding: "var(--p-space-600) var(--p-space-400)",
                        gridColumn: "1 / -1",
                      }}
                    >
                      <Text as="p" variant="headingMd" alignment="start">
                        Product
                      </Text>
                    </th>
                  </tr>
                  <tr>
                    <th style={thStyle}></th>
                    <th style={thStyle}>
                      <Text as="p" tone="subdued" alignment="start">
                        Reference
                      </Text>
                    </th>
                    <th style={thStyle}>
                      <Text as="p" tone="subdued" alignment="start">
                        {currentLocale.name}
                        {currentMarket.id ? ` for ${currentMarket.name}` : ``}
                      </Text>
                    </th>
                    <th style={thStyle}>
                      <Text as="p" tone="subdued" alignment="start">
                        Last Updated
                      </Text>
                    </th>
                    <th style={thStyle}>
                      <Text as="p" tone="subdued" alignment="start">
                        Status
                      </Text>
                    </th>
                    <th style={thStyle}>
                      <Text as="p" tone="subdued" alignment="start">
                        Approval
                      </Text>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transData[productInfoIds.id].map((x, i) => (
                    <tr key={"transmain-tr--" + i}>
                      <td
                        style={cellStyle}
                        className={
                          currentHighlight == x.key ? "highlighted" : ""
                        }
                      >
                        <InlineStack gap="200" align="start" blockAlign="start">
                          <div
                            style={renderDisabledCheckboxStyles(
                              productInfoIds.id,
                              x.key,
                            )}
                          >
                            <Checkbox
                              label=""
                              checked={checkedItems.has(
                                `${productInfoIds.id}-${x.key}`,
                              )}
                              onChange={() =>
                                toggleItemCheck(productInfoIds.id, x.key)
                              }
                            />
                          </div>
                          <BlockStack gap="100">
                            <Text as="p" variant="headingSm">
                              {getKeyLabel(x.key)}
                            </Text>
                            <Text as="p" tone="subdued" variant="bodySm">
                              Source: {getLanguageLabel(x.locale)}
                            </Text>
                          </BlockStack>
                        </InlineStack>
                      </td>
                      <td
                        className="cell cell--source"
                        style={{
                          ...cellStyle,
                          ...sourceCellStyle,
                          ...xtraCellStyle(x.type),
                        }}
                      >
                        {renderTransSource(x.type, x.value)}
                      </td>
                      <td
                        className="cell cell--target"
                        style={{ ...cellStyle, ...targetCellStyle }}
                      >
                        {renderTransEditor(x.type, productInfoIds.id, x.key)}
                      </td>
                      <td style={cellStyle}>
                        <Text as="p">
                          {transDataObject[productInfoIds.id]?.[x.key]?.[
                            "updated"
                          ] ? (
                            <>
                              {getReadableDate(
                                new Date(
                                  transDataObject[productInfoIds.id][x.key][
                                    "updated"
                                  ],
                                ),
                              )}
                            </>
                          ) : (
                            "No translation set"
                          )}
                        </Text>
                      </td>

                      <td style={cellStyle}>
                        {renderStatus(productInfoIds.id, x.key)}
                      </td>
                      <td style={cellStyle}>
                        {renderActionButtons(productInfoIds.id, x.key)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card padding="0">
              <table
                className="table table--translate"
                width="100%"
                cellSpacing="0"
                cellPadding="0"
              >
                <thead>
                  <tr>
                    <th
                      colSpan={3}
                      style={{
                        padding: "var(--p-space-600) var(--p-space-400)",
                        gridColumn: "1 / -1",
                      }}
                    >
                      <Text as="p" variant="headingMd" alignment="start">
                        Product options
                      </Text>
                    </th>
                  </tr>
                  <tr>
                    <th style={thStyle}></th>
                    <th style={thStyle}>
                      <Text as="p" tone="subdued">
                        Reference
                      </Text>
                    </th>
                    <th style={thStyle}>
                      <Text as="p" tone="subdued">
                        {currentLocale.name}
                      </Text>
                    </th>

                    <th style={thStyle}>
                      <Text as="p" tone="subdued" alignment="start">
                        Last Updated
                      </Text>
                    </th>
                    <th style={thStyle}>
                      <Text as="p" tone="subdued" alignment="start">
                        Status
                      </Text>
                    </th>
                    <th style={thStyle}>
                      <Text as="p" tone="subdued" alignment="start">
                        Approval
                      </Text>
                    </th>
                  </tr>
                </thead>

                {productInfoIds.options.map((x, i) => (
                  <tbody key={"transopt-tbody--" + i}>
                    <tr>
                      <td
                        style={cellStyle}
                        className={
                          extractId(x.id) == currentHighlight
                            ? "highlighted"
                            : ""
                        }
                      >
                        <InlineStack gap="200" align="start" blockAlign="start">
                          <div
                            style={renderDisabledCheckboxStyles(x.id, "name")}
                          >
                            <Checkbox
                              label=""
                              checked={checkedItems.has(`${x.id}-name`)}
                              onChange={() => toggleItemCheck(x.id, "name")}
                            />
                          </div>
                          <BlockStack gap="100">
                            <Text as="p" variant="headingSm">
                              Option name
                            </Text>
                            <Text as="p" tone="subdued" variant="bodySm">
                              Source:{" "}
                              {getLanguageLabel(
                                transDataObject[x.id]["name"].locale,
                              )}
                            </Text>
                          </BlockStack>
                        </InlineStack>
                      </td>
                      <td
                        className="cell cell--source"
                        style={{
                          ...cellStyle,
                          ...sourceCellStyle,
                          ...xtraCellStyle(x.type),
                        }}
                      >
                        {renderTransSource(
                          x.type,
                          transDataObject[x.id]["name"].value,
                        )}
                      </td>
                      <td
                        className="cell cell--target"
                        style={{ ...cellStyle, ...targetCellStyle }}
                      >
                        {renderTransEditor(x.type, x.id, "name")}
                      </td>
                      <td style={cellStyle}>
                        <Text as="p">
                          {transDataObject[productInfoIds.id]?.[x.key]?.[
                            "updated"
                          ] ? (
                            <>
                              {getReadableDate(
                                new Date(
                                  transDataObject[productInfoIds.id][x.key][
                                    "updated"
                                  ],
                                ),
                              )}
                            </>
                          ) : (
                            "No translation set"
                          )}
                        </Text>
                      </td>
                      <td style={cellStyle}>{renderStatus(x.id, "name")}</td>
                      <td style={cellStyle}>
                        {renderActionButtons(x.id, "name")}
                      </td>
                    </tr>

                    {x.optionValues.map((ov, j) => (
                      <tr key={"transopt-tr-ov--" + i + "-" + j}>
                        <td style={cellStyle}>
                          <InlineStack
                            gap="200"
                            align="start"
                            blockAlign="start"
                          >
                            <div
                              style={renderDisabledCheckboxStyles(
                                ov.id,
                                "name",
                              )}
                            >
                              <Checkbox
                                label=""
                                checked={checkedItems.has(`${ov.id}-name`)}
                                onChange={() => toggleItemCheck(ov.id, "name")}
                              />
                            </div>
                            <BlockStack gap="100">
                              <Text as="p" variant="headingSm">
                                {j === 0 ? x.name : ""}
                              </Text>
                              {j === 0 && (
                                <Text as="p" tone="subdued" variant="bodySm">
                                  Option values
                                </Text>
                              )}
                              <Text as="p" tone="subdued" variant="bodySm">
                                Source:{" "}
                                {getLanguageLabel(
                                  transDataObject[ov.id]["name"].locale,
                                )}
                              </Text>
                            </BlockStack>
                          </InlineStack>
                        </td>

                        <td
                          className={
                            "cell cell--source " +
                            (extractId(ov.id) == currentHighlight
                              ? "highlighted"
                              : "")
                          }
                          style={{
                            ...cellStyle,
                            ...sourceCellStyle,
                            ...xtraCellStyle(x.type),
                          }}
                        >
                          {renderTransSource(
                            ov.type,
                            transDataObject[ov.id]["name"].value,
                          )}
                        </td>
                        <td
                          className="cell cell--target"
                          style={{ ...cellStyle, ...targetCellStyle }}
                        >
                          {renderTransEditor(ov.type, ov.id, "name")}
                        </td>

                        <td style={cellStyle}>
                          <Text as="p">
                            {transDataObject[productInfoIds.id]?.[x.key]?.[
                              "updated"
                            ] ? (
                              <>
                                {getReadableDate(
                                  new Date(
                                    transDataObject[productInfoIds.id][x.key][
                                      "updated"
                                    ],
                                  ),
                                )}
                              </>
                            ) : (
                              "No translation set"
                            )}
                          </Text>
                        </td>
                        <td style={cellStyle}>{renderStatus(ov.id, "name")}</td>
                        <td style={cellStyle}>
                          {renderActionButtons(ov.id, "name")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                ))}
              </table>
            </Card>
          </BlockStack>
        )}

        {Object.keys(commonReadActions).includes(path + "_read") && (
          <BlockStack gap="400">

            <Card padding="0">
              <table
                className="table table--translate"
                width="100%"
                cellSpacing="0"
                cellPadding="0"
              >
                <thead>
                  <tr>
                    <th
                      colSpan={3}
                      style={{
                        padding: "var(--p-space-600) var(--p-space-400)",
                        gridColumn: "1 / -1",
                      }}
                    >
                      <Text as="p" variant="headingMd" alignment="start">
                        {makeReadable(path)}
                      </Text>
                    </th>
                  </tr>
                  <tr>
                    <th style={thStyle}></th>
                    <th style={thStyle}>
                      <Text as="p" tone="subdued" alignment="start">
                        Reference
                      </Text>
                    </th>
                    <th style={thStyle}>
                      <Text as="p" tone="subdued" alignment="start">
                        {currentLocale.name}
                        {currentMarket.id ? ` for ${currentMarket.name}` : ``}
                      </Text>
                    </th>
                    <th style={thStyle}>
                      <Text as="p" tone="subdued" alignment="start">
                        Last Updated
                      </Text>
                    </th>
                    <th style={thStyle}>
                      <Text as="p" tone="subdued" alignment="start">
                        Status
                      </Text>
                    </th>
                    <th style={thStyle}>
                      <Text as="p" tone="subdued" alignment="start">
                        Approval
                      </Text>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transData[resourceInfo.id] &&
                    transData[resourceInfo.id].map((x, i) => (
                      <tr key={"transmain-tr--" + i}>
                        <td
                          width="15%"
                          style={cellStyle}
                          className={
                            currentHighlight == x.key ? "highlighted" : ""
                          }
                        >
                          <InlineStack
                            gap="200"
                            align="start"
                            blockAlign="start"
                          >
                            <Checkbox
                              label=""
                              checked={checkedItems.has(
                                `${resourceInfo.id}-${x.key}`,
                              )}
                              onChange={() =>
                                toggleItemCheck(resourceInfo.id, x.key)
                              }
                            />
                            <BlockStack gap="100">
                              <Text as="p" variant="headingSm">
                                {getKeyLabel(x.key)}
                              </Text>
                              <Text as="p" tone="subdued" variant="bodySm">
                                Source: {getLanguageLabel(x.locale)}
                              </Text>
                            </BlockStack>
                          </InlineStack>
                        </td>
                        <td
                          width="40%"
                          className="cell cell--source"
                          style={{
                            ...cellStyle,
                            ...sourceCellStyle,
                            ...xtraCellStyle(x.type),
                          }}
                        >
                          {renderTransSource(x.type, x.value)}
                        </td>
                        <td
                          width="40%"
                          className="cell cell--target"
                          style={{ ...cellStyle, ...targetCellStyle }}
                        >
                          {renderTransEditor(x.type, resourceInfo.id, x.key)}
                        </td>
                        <td style={cellStyle}>
                          <Text as="p">Apr 1, 2025 - 11:28</Text>
                        </td>
                        <td style={cellStyle}>
                          {renderStatus(resourceInfo.id, x.key)}
                        </td>
                        <td style={cellStyle}>
                          {renderActionButtons(resourceInfo.id, x.key)}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </Card>
            
            {path == 'menu' && (
              <Card padding="0">
                <table
                  className="table table--translate"
                  width="100%"
                  cellSpacing="0"
                  cellPadding="0"
                >
                  <thead>
                    <tr>
                      <th
                        colSpan={3}
                        style={{
                          padding: "var(--p-space-600) var(--p-space-400)",
                          gridColumn: "1 / -1",
                        }}
                      >
                        <Text as="p" variant="headingMd" alignment="start">
                          Menu Items
                        </Text>
                      </th>
                    </tr>
                    <tr>
                      <th style={thStyle}></th>
                      <th style={thStyle}>
                        <Text as="p" tone="subdued" alignment="start">
                          Reference
                        </Text>
                      </th>
                      <th style={thStyle}>
                        <Text as="p" tone="subdued" alignment="start">
                          {currentLocale.name}
                          {currentMarket.id ? ` for ${currentMarket.name}` : ``}
                        </Text>
                      </th>
                      <th style={thStyle}>
                        <Text as="p" tone="subdued" alignment="start">
                          Last Updated
                        </Text>
                      </th>
                      <th style={thStyle}>
                        <Text as="p" tone="subdued" alignment="start">
                          Status
                        </Text>
                      </th>
                      <th style={thStyle}>
                        <Text as="p" tone="subdued" alignment="start">
                          Approval
                        </Text>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {resourceInfo.items.map((menuItemId, index) => (
                      <>
                      {transData[menuItemId] &&
                        transData[menuItemId].map((x, i) => (
                          <tr key={"transmain-tr--" + i}>
                            <td
                              width="15%"
                              style={cellStyle}
                              className={
                                currentHighlight == menuItemId.split('/').pop() ? "highlighted" : ""
                              }
                            >
                              <InlineStack
                                gap="200"
                                align="start"
                                blockAlign="start"
                              >
                                <Checkbox
                                  label=""
                                  checked={checkedItems.has(
                                    `${menuItemId}-${x.key}`,
                                  )}
                                  onChange={() =>
                                    toggleItemCheck(menuItemId, x.key)
                                  }
                                />
                                <BlockStack gap="100">
                                  <Text as="p" variant="headingSm">
                                    {getKeyLabel(x.key)}
                                  </Text>
                                  <Text as="p" tone="subdued" variant="bodySm">
                                    Source: {getLanguageLabel(x.locale)}
                                  </Text>
                                </BlockStack>
                              </InlineStack>
                            </td>
                            <td
                              width="40%"
                              className="cell cell--source"
                              style={{
                                ...cellStyle,
                                ...sourceCellStyle,
                                ...xtraCellStyle(x.type),
                              }}
                            >
                              {renderTransSource(x.type, x.value)}
                            </td>
                            <td
                              width="40%"
                              className="cell cell--target"
                              style={{ ...cellStyle, ...targetCellStyle }}
                            >
                              {renderTransEditor(x.type, menuItemId, x.key)}
                            </td>
                            <td style={cellStyle}>
                              <Text as="p">Apr 1, 2025 - 11:28</Text>
                            </td>
                            <td style={cellStyle}>
                              {renderStatus(menuItemId, x.key)}
                            </td>
                            <td style={cellStyle}>
                              {renderActionButtons(menuItemId, x.key)}
                            </td>
                          </tr>
                        ))
                      }
                      </>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
            
          </BlockStack>
        )}
      </div>
    );
  };

  // Add new state declarations
  const [translationStatus, setTranslationStatus] = useState({});
  const [preSaveValues, setPreSaveValues] = useState({});
  const [editorResetCount, setEditorResetCount] = useState(0);
  const [savingItems, setSavingItems] = useState<{ [key: string]: boolean }>(
    {},
  );
  const [translatingItems, setTranslatingItems] = useState<{
    [key: string]: boolean;
  }>({});
  const [originalTranslations, setOriginalTranslations] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);

  // Add a ref to track whether we've already fetched states for this resource
  const fetchedResourceRef = useRef("");

  // Load translation states from database when a resource is selected
  useEffect(() => {
    if (selectedResource && shop && currentLocale?.locale) {
      // Only fetch if we haven't already fetched for this resource
      const resourceId = selectedResource.id;
      const currentLocaleId = currentLocale.locale;
      const currentMarketId = currentMarket?.id || "";
      const resourceKey = `${resourceId}-${currentLocaleId}-${currentMarketId}`;

      // Skip if we've already fetched for this exact resource/locale/market combination
      if (fetchedResourceRef.current === resourceKey) {
        console.log("Skipping duplicate fetchStates call for:", resourceKey);
        return;
      }

      // Fetch translation states for the selected resource
      const fetchStates = async () => {
        try {
          console.log("Fetching states for:", resourceKey);

          // Always use parentProductId which will fetch the resource and all its related items
          // This works for both products and other resources
          const data = await getTranslationStateByParentProductId(
            shop,
            resourceId,
            currentLocaleId,
            currentMarketId,
          );

          // Convert array to expected format
          const statusMap = {};
          const previousValuesMap = {};

          if (Array.isArray(data)) {
            data.forEach((row) => {
              const key = `${row.resourceId}-${row.field}`;
              if (row.status) {
                statusMap[key] = row.status;
              }
              if (row.previousValue) {
                previousValuesMap[key] = row.previousValue;
              }
            });
          }

          setTranslationStatus(statusMap);
          setPreSaveValues(previousValuesMap);

          // Mark as fetched for this resource
          fetchedResourceRef.current = resourceKey;
        } catch (error) {
          console.error("Error fetching translation states:", error);
        }
      };

      fetchStates();
    }
  }, [selectedResource, shop, currentLocale, currentMarket]);

  // Add this helper function for translation info
  const getTranslationInfo = (id: string, key: string) => {
    const currentValue = getTranslatedValue(id, key);
    const originalValue = originalTranslations[`${id}-${key}`] || "";
    const status = translationStatus[`${id}-${key}`];
    const hasChanged = currentValue !== originalValue;
    const hasTranslation = currentValue.trim() !== "";

    return {
      current: currentValue,
      original: originalValue,
      status,
      hasChanged,
      hasTranslation,
    };
  };

  // Update handleTranslationApproval
  const handleTranslationApproval = async (id: string, key: string) => {
    const lastSavedValue = cleanFormState[id]?.[key]?.value || "";
    console.log("Storing last saved value:", lastSavedValue);

    // Update local state
    setPreSaveValues((prev) => ({
      ...prev,
      [`${id}-${key}`]: lastSavedValue,
    }));

    setSavingItems((prev) => ({
      ...prev,
      [`${id}-${key}`]: true,
    }));

    // Update translation status immediately to provide user feedback
    setTranslationStatus((prev) => ({
      ...prev,
      [`${id}-${key}`]: "confirmed",
    }));

    // Determine resource type based on the id
    let resourceType = "product";
    let parentProductId = "";

    if (id.includes("ProductOption/")) {
      resourceType = "option";
      parentProductId = selectedResource.id;
    } else if (id.includes("ProductOptionValue/")) {
      resourceType = "option_value";
      parentProductId = selectedResource.id;
    } else if (id === selectedResource.id) {
      // This is the main product
      resourceType = "product";
      parentProductId = id; // Product is its own parent
    }

    // Save to database
    if (shop) {
      try {
        await updateTranslationState(
          shop,
          id,
          key,
          currentLocale.locale,
          currentMarket?.id || "",
          {
            status: "confirmed",
            previousValue: lastSavedValue,
          },
          resourceType as ResourceType,
          parentProductId,
        );
      } catch (error) {
        console.error("Error updating translation state:", error);
      }
    }

    // Ensure we have the form state entry for this key
    if (!formState[id]) {
      formState[id] = {};
    }
    
    // If this is an empty translation being saved, ensure we have a proper object to submit
    if (!formState[id][key] && transDataObject[id] && transDataObject[id][key]) {
      // Clone the original object but set empty value
      const emptyTransObj = { ...transDataObject[id][key] };
      emptyTransObj.value = "";
      emptyTransObj.translatableContentDigest = emptyTransObj.digest;
      delete emptyTransObj.digest;
      delete emptyTransObj.type;
      delete emptyTransObj.updated;
      
      // Update form state
      formStateDispatch({
        type: "setTraslation",
        id: id,
        traslation: emptyTransObj,
      });
    }

    // Create a temporary copy in case fetcher.submit fails
    const currentFormValue = formState[id]?.[key] || { key, value: "" };

    const translation = {
      id,
      type: transIdTypes[id] ? transIdTypes[id] : "",
      data: [currentFormValue],
    };

    const data = {
      translations: JSON.stringify([translation]),
      origin: JSON.stringify({
        [id]: {
          [key]: transDataObject[id][key],
        },
      }),
      id: selectedResource.id,
      market: currentMarket.id,
      marketLabel: currentMarket.name,
      locale: currentLocale.locale,
      action: "trans_submit",
    };

    console.log("Submitting data:", data);

    // Set a timeout to clear loading state in case the API call fails
    const timeoutId = setTimeout(() => {
      setSavingItems((prev) => ({
        ...prev,
        [`${id}-${key}`]: false,
      }));
    }, 5000);

    try {
      fetcher.submit(data, { action: "/api", method: "post" });
    } catch (error) {
      console.error("Error submitting translation:", error);
      clearTimeout(timeoutId);
      setSavingItems((prev) => ({
        ...prev,
        [`${id}-${key}`]: false,
      }));
    }
  };

  // Update handleTranslationUndo
  const handleTranslationUndo = (id: string, key: string) => {
    const previousValue = preSaveValues[`${id}-${key}`];
    console.log("Attempting to restore to previous value:", previousValue);

    if (previousValue !== undefined) {
      console.log("Restoring to:", previousValue);
      updateTranslation(id, key, previousValue, true);

      // Update local state
      setTranslationStatus((prev) => {
        const newStatus = { ...prev };
        delete newStatus[`${id}-${key}`];
        return newStatus;
      });

      setPreSaveValues((prev) => {
        const newValues = { ...prev };
        delete newValues[`${id}-${key}`];
        return newValues;
      });

      // Delete from database
      if (shop) {
        try {
          deleteTranslationState(
            shop,
            id,
            key,
            currentLocale.locale,
            currentMarket?.id || "",
          );
        } catch (error) {
          console.error("Error deleting translation state:", error);
        }
      }
    }
  };

  // Update handleTranslationRejection
  const handleTranslationRejection = (id: string, key: string) => {
    // We're intentionally clearing the field, so create a proper empty translation object
    if (transDataObject[id] && transDataObject[id][key]) {
      // Clone the original object but set empty value
      const emptyTransObj = { ...transDataObject[id][key] };
      emptyTransObj.value = "";
      emptyTransObj.translatableContentDigest = emptyTransObj.digest;
      delete emptyTransObj.digest;
      delete emptyTransObj.type;
      delete emptyTransObj.updated;
      
      // Update form state with empty value
      formStateDispatch({
        type: "setTraslation",
        id: id,
        traslation: emptyTransObj,
      });
    }
  };

  // Update handleTranslation function
  const handleTranslation = async () => {
    const currentTranslations = {};
    const itemsToTranslate = [];

    setIsTranslating(true);

    // Clear any existing translating items
    setTranslatingItems({});

    // First, collect translatable product items
    if (transData[productInfoIds.id]) {
      // Use transDataObject directly instead of formState to ensure we find ALL items with reference values
      // Even if they don't have a translation yet in the form state
      transData[productInfoIds.id].forEach((item) => {
        const key = item.key;
        const translationKey = `${productInfoIds.id}-${key}`;

        // Check if there's a valid reference value in the source data
        const hasReferenceValue =
          item.value !== undefined && item.value.trim() !== "";

        if (
          hasReferenceValue &&
          translationStatus[translationKey] !== "confirmed"
        ) {
          itemsToTranslate.push({ id: productInfoIds.id, key });

          // Mark this item as "translating"
          setTranslatingItems((prev) => ({
            ...prev,
            [translationKey]: true,
          }));

          // Store current translation values for later comparison
          currentTranslations[translationKey] = getTranslatedValue(
            productInfoIds.id,
            key,
          );
        }
      });
    }

    // Then collect translatable option items
    if (productInfoIds.options) {
      productInfoIds.options.forEach((option) => {
        // Option name
        if (transData[option.id]) {
          const translationKey = `${option.id}-name`;
          const hasReferenceValue =
            transDataObject[option.id]?.name?.value !== undefined &&
            transDataObject[option.id]?.name?.value.trim() !== "";

          if (
            hasReferenceValue &&
            translationStatus[translationKey] !== "confirmed"
          ) {
            itemsToTranslate.push({ id: option.id, key: "name" });

            setTranslatingItems((prev) => ({
              ...prev,
              [translationKey]: true,
            }));

            currentTranslations[translationKey] = getTranslatedValue(
              option.id,
              "name",
            );
          }
        }

        // Option values
        option.optionValues.forEach((value) => {
          if (transData[value.id]) {
            const translationKey = `${value.id}-name`;
            const hasReferenceValue =
              transDataObject[value.id]?.name?.value !== undefined &&
              transDataObject[value.id]?.name?.value.trim() !== "";

            if (
              hasReferenceValue &&
              translationStatus[translationKey] !== "confirmed"
            ) {
              itemsToTranslate.push({ id: value.id, key: "name" });

              setTranslatingItems((prev) => ({
                ...prev,
                [translationKey]: true,
              }));

              currentTranslations[translationKey] = getTranslatedValue(
                value.id,
                "name",
              );
            }
          }
        });
      });
    }

    setOriginalTranslations(currentTranslations);

    try {
      const translatedObject = await translate();

      // Handle main product translations
      if (translatedObject.product) {
        Object.entries(translatedObject.product).forEach(
          ([key, translatedValue]) => {
            const translationKey = `${productInfoIds.id}-${key}`;
            // Only update if not confirmed
            if (translationStatus[translationKey] !== "confirmed") {
              // Pass true to skipStatusUpdate since this is an automated translation
              updateTranslation(productInfoIds.id, key, translatedValue, true);

              // Clear the translating status
              setTranslatingItems((prev) => ({
                ...prev,
                [translationKey]: false,
              }));
            }
          },
        );
      }

      // Handle options translations
      if (translatedObject.options) {
        Object.entries(translatedObject.options).forEach(([id, data]) => {
          const translationKey = `${id}-name`;
          // Only update if not confirmed
          if (data.name && translationStatus[translationKey] !== "confirmed") {
            // Pass true to skipStatusUpdate since this is an automated translation
            updateTranslation(id, "name", data.name, true);

            // Clear the translating status
            setTranslatingItems((prev) => ({
              ...prev,
              [translationKey]: false,
            }));
          }
        });
      }

      // Update status for translated items
      setTranslationStatus((prev) => {
        const newStatus = { ...prev };
        itemsToTranslate.forEach(({ id, key }) => {
          // Skip confirmed items
          if (newStatus[`${id}-${key}`] !== "confirmed") {
            delete newStatus[`${id}-${key}`];
          }
        });
        return newStatus;
      });
    } catch (error) {
      console.error("Translation error:", error);
    } finally {
      // Ensure all translating statuses are cleared
      setTranslatingItems({});
      setIsTranslating(false);
      setEditorResetCount((prev) => prev + 1);
    }
  };

  // Add the status rendering function
  const renderStatus = (id: string, key: string) => {
    const info = getTranslationInfo(id, key);
    const isTranslating = translatingItems[`${id}-${key}`] === true;

    // Check if this is a confirmed field that has been edited
    const isEdited =
      info.status === "confirmed" &&
      cleanFormState[id]?.[key]?.value !== undefined &&
      cleanFormState[id][key].value !== info.current;

    if (isTranslating) {
      return (
        <Badge progress="complete" tone="info">
          <Text as="span" fontWeight="bold">
            In progress
          </Text>
        </Badge>
      );
    }

    if (info.status === "confirmed" && !isEdited) {
      return (
        <Badge tone="success" progress="complete">
          <Text as="span" fontWeight="bold">
            Confirmed
          </Text>
        </Badge>
      );
    } else if (isEdited || info.hasTranslation) {
      return (
        <Badge tone="warning" progress="complete">
          <Text as="span" fontWeight="bold">
            Needs attention
          </Text>
        </Badge>
      );
    } else {
      return (
        <Badge tone="critical" progress="complete">
          <Text as="span" fontWeight="bold">
            Not translated
          </Text>
        </Badge>
      );
    }
  };

  // Add the action buttons rendering function
  const renderActionButtons = (id: string, key: string) => {
    const info = getTranslationInfo(id, key);
    const hasChanges = info.current !== info.original;
    const needsAttention = info.status === "needs_attention";
    const hasTranslation = info.current.trim() !== "";

    // Check if this is a confirmed field that has been edited
    const isEdited =
      info.status === "confirmed" &&
      cleanFormState[id]?.[key]?.value !== undefined &&
      cleanFormState[id][key].value !== info.current;

    const isConfirmed = info.status === "confirmed" && !isEdited;
    const isSaving = savingItems[`${id}-${key}`] === true;
    const isTranslating = translatingItems[`${id}-${key}`] === true;

    // Modified canSave to allow saving even for empty translations
    const canSave =
      hasChanges ||
      needsAttention ||
      !info.status || // Allow saving if no status (including empty translations)
      isEdited;

    return (
      <ButtonGroup>
        <Button
          icon={CheckIcon}
          loading={isSaving || isTranslating}
          disabled={isSaving || isTranslating}
          variant={isConfirmed ? "primary" : "secondary"}
          tone={isConfirmed ? "success" : undefined}
          onClick={() => {
            if (canSave && !isSaving && !isTranslating) {
              handleTranslationApproval(id, key);
            }
          }}
        />
        {isConfirmed ? (
          <Button
            icon={UndoIcon}
            variant="secondary"
            disabled={isSaving || isTranslating}
            onClick={() => handleTranslationUndo(id, key)}
          />
        ) : (
          <Button
            icon={XIcon}
            variant="secondary"
            disabled={isSaving || isTranslating}
            onClick={() => handleTranslationRejection(id, key)}
          />
        )}
      </ButtonGroup>
    );
  };

  const toggleItemCheck = (id: string, key: string) => {
    const itemKey = `${id}-${key}`;
    
    // Remove the restriction on empty values - allow all items to be checked
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemKey)) {
        newSet.delete(itemKey);
      } else {
        newSet.add(itemKey);
      }
      return newSet;
    });
  };

  const handleBulkSave = async () => {
    if (checkedItems.size === 0) return;

    setIsBulkSaving(true);

    // Collect all translations to save
    const translationsToSave = [];
    const transOrigin = {};

    checkedItems.forEach((itemKey) => {
      const [id, key] = itemKey.split("-");

      // Store the last saved value for potential undo
      const lastSavedValue = cleanFormState[id]?.[key]?.value || "";
      setPreSaveValues((prev) => ({
        ...prev,
        [itemKey]: lastSavedValue,
      }));

      // Mark as saving
      setSavingItems((prev) => ({
        ...prev,
        [itemKey]: true,
      }));

      // Update translation status immediately to provide user feedback
      setTranslationStatus((prev) => ({
        ...prev,
        [itemKey]: "confirmed",
      }));

      // Determine resource type based on the id
      let resourceType = "product";
      let parentProductId = "";

      if (id.includes("ProductOption/")) {
        resourceType = "option";
        parentProductId = selectedResource.id;
      } else if (id.includes("ProductOptionValue/")) {
        resourceType = "option_value";
        parentProductId = selectedResource.id;
      } else if (id === selectedResource.id) {
        // This is the main product
        resourceType = "product";
        parentProductId = id; // Product is its own parent
      }

      // Save to database
      if (shop) {
        try {
          updateTranslationState(
            shop,
            id,
            key,
            currentLocale.locale,
            currentMarket?.id || "",
            {
              status: "confirmed",
              previousValue: lastSavedValue,
            },
            resourceType as ResourceType,
            parentProductId,
          );
        } catch (error) {
          console.error("Error updating translation state:", error);
        }
      }

      // Ensure we have the form state entry for this key
      if (!formState[id]) {
        formState[id] = {};
      }
      
      // If this is an empty translation being saved, ensure we have a proper object to submit
      if (!formState[id][key] && transDataObject[id] && transDataObject[id][key]) {
        // Clone the original object but set empty value
        const emptyTransObj = { ...transDataObject[id][key] };
        emptyTransObj.value = "";
        emptyTransObj.translatableContentDigest = emptyTransObj.digest;
        delete emptyTransObj.digest;
        delete emptyTransObj.type;
        delete emptyTransObj.updated;
        
        // Update form state
        formStateDispatch({
          type: "setTraslation",
          id: id,
          traslation: emptyTransObj,
        });
      }

      // Get current form value, fallback to empty object if not found
      const currentFormValue = formState[id]?.[key] || { key, value: "" };

      // Only add to bulk save if we have a valid form state for this item
      translationsToSave.push({
        id,
        type: transIdTypes[id] ? transIdTypes[id] : "",
        data: [currentFormValue],
      });
      transOrigin[id] = structuredClone(transDataObject[id]);
    });

    // Submit translations in bulk
    const data = {
      translations: JSON.stringify(translationsToSave),
      origin: JSON.stringify(transOrigin),
      id: selectedResource.id,
      market: currentMarket.id,
      marketLabel: currentMarket.name,
      locale: currentLocale.locale,
      action: "trans_submit",
    };

    // Set a timeout to clear loading state in case the API call fails
    const timeoutId = setTimeout(() => {
      setIsBulkSaving(false);
      setSavingItems({});
    }, 5000);

    try {
      fetcher.submit(data, { action: "/api", method: "post" });
    } catch (error) {
      console.error("Error submitting bulk translations:", error);
      clearTimeout(timeoutId);
      setIsBulkSaving(false);
      setSavingItems({});
      setCheckedItems(new Set());
    }
  };

  const renderDisabledCheckboxStyles = (id: string, key: string) => {
    // Always return empty styles - we'll now allow all checkboxes to be checked
    return {};
  };

  // Replace the progress bar rendering logic with a function that calculates the counts
  const calculateTranslationStatus = () => {
    // Get counts of all translatable items
    let confirmedCount = 0;
    let needsAttentionCount = 0;
    let notTranslatedCount = 0;

    // First, gather all translatable items to establish the total count
    const allTranslatableItems = new Set();

    // Process product data
    if (productInfoIds.id && transData[productInfoIds.id]) {
      transData[productInfoIds.id].forEach((item) => {
        allTranslatableItems.add(`${productInfoIds.id}-${item.key}`);
      });
    }

    // Process options data
    if (productInfoIds.options) {
      productInfoIds.options.forEach((option) => {
        if (transData[option.id]) {
          allTranslatableItems.add(`${option.id}-name`);
        }

        // Option values
        option.optionValues.forEach((value) => {
          if (transData[value.id]) {
            allTranslatableItems.add(`${value.id}-name`);
          }
        });
      });
    }

    // Process resource info data
    if (resourceInfo.id && transData[resourceInfo.id]) {
      transData[resourceInfo.id].forEach((item) => {
        allTranslatableItems.add(`${resourceInfo.id}-${item.key}`);
      });
    }

    // Now categorize each item
    allTranslatableItems.forEach((key) => {
      const [id, fieldKey] = key.split("-");

      if (translationStatus[key] === "confirmed") {
        confirmedCount++;
      } else if (getTranslatedValue(id, fieldKey).trim() !== "") {
        needsAttentionCount++;
      } else {
        notTranslatedCount++;
      }
    });

    const total = allTranslatableItems.size;

    return {
      confirmedCount,
      needsAttentionCount,
      notTranslatedCount,
      total,
    };
  };

  const hasTranslatables = (resource:any) => {
    let returnFlag = true;
    const sectionPath = resource._path ?? path;
    
    if (sectionPath == 'shop') {
      returnFlag = (transData[resourceInfo.id] && (transData[resourceInfo.id].length > 0));
    }
    
    return returnFlag;
  }

  return (
    <Box>
      {!init || !isLoaded ? (
        <SkeletonLocalize section={section} />
      ) : (
        <Box minHeight="100%">
          {isLoading && <LoadingScreen opacity="1" />}
          {isSaving && <LoadingScreen />}
          <Box>
            <FullscreenBar onAction={returnHome}>
              <div
                style={{
                  display: "flex",
                  flexGrow: 1,
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingLeft: "1rem",
                  paddingRight: "1rem",
                }}
              >
                <div style={{ marginLeft: "1rem", flexGrow: 1 }}>
                  <SearchBar
                    onSearch={(value) => setSearchKey(value)}
                    onToggleVisibility={(isVisible) =>
                      setIsSearchVisible(isVisible)
                    }
                    isVisible={isSearchVisible}
                    selectors={context.selectors}
                  />
                </div>
                <ButtonGroup>
                  {!isFullscreenMode && (
                    <Button
                      icon={LayoutBlockIcon}
                      accessibilityLabel="Fullscreen"
                      onClick={() => {
                        enterFullscreen(fullscreenRef.current);
                      }}
                    />
                  )}

                  {/* <SyncRunner /> */}

                  <Button
                    onClick={() => {
                      getRedirect(shopify).dispatch(Redirect.Action.REMOTE, {
                        url: context.shop,
                        newContext: true,
                      });
                    }}
                  >
                    View Store
                  </Button>

                  <Button
                    variant="primary"
                    onClick={() => {
                      submitTranslations();
                    }}
                    disabled={!isDirty}
                  >
                    Save
                  </Button>
                </ButtonGroup>
              </div>
            </FullscreenBar>
          </Box>

          <div className="fullscreenLayout withTopBar">
            <div className="layout layout--translate">
              <div className="layout__section layout__section--resource">
                {section == "product" && (
                  <ProductsPanel
                    onSelect={selectResource}
                    selected={selectedResource}
                    section={section}
                    visible={!isSearchVisible}
                  />
                )}
                {section == "collection" && (
                  <CollectionsPanel
                    onSelect={selectResource}
                    selected={selectedResource}
                    section={section}
                    visible={!isSearchVisible}
                  />
                )}
                {section == "blog" && (
                  <BlogsPanel
                    onSelect={selectResource}
                    selected={selectedResource}
                    section={section}
                    visible={!isSearchVisible}
                  />
                )}
                {section == "article" && (
                  <ArticlesPanel
                    onSelect={selectResource}
                    selected={selectedResource}
                    section={section}
                    visible={!isSearchVisible}
                  />
                )}
                {section == "page" && (
                  <PagesPanel
                    onSelect={selectResource}
                    selected={selectedResource}
                    section={section}
                    visible={!isSearchVisible}
                  />
                )}
                {section == "content" && (
                  <ThemeContentPanel
                    onSelect={selectResource}
                    onInject={injectTransReadData}
                    setLoading={setIsTranslationLoading}
                    selected={selectedResource}
                    section={section}
                    visible={!isSearchVisible}
                    theme={theme}
                    locale={currentLocale}
                    market={currentMarket}
                  />
                )}

                {[
                  "filter",
                  "policy",
                  "metaobject",
                  "template",
                  "theme",
                  "static",
                  "section",
                  "embed",
                  "menu",
                  "shop",
                  "notification",
                ].includes(section) && (
                  <ResourcesPanel
                    onSelect={selectResource}
                    selected={selectedResource}
                    section={section}
                    visible={!isSearchVisible}
                    key={"resroueces_panel_" + section}
                  />
                )}

                <SearchPanel
                  q={searchKey}
                  onSelect={selectResource}
                  locales={context.locales}
                  markets={context.markets}
                  visible={isSearchVisible}
                />
              </div>

              <div className="layout__section layout__section--translate">
                <div
                  style={{
                    height: "100%",
                    overflow: "auto",
                    position: "relative",
                  }}
                >
                  <div style={{ position: "relative" }}>
                    {/* {isTranslationLoading && (<LoadingScreen position='absolute' />)} */}

                    <Box padding="400">
                      {selectedResource && hasTranslatables(selectedResource) ? (
                        <BlockStack gap="400">
                          <InlineStack
                            align="space-between"
                            blockAlign="center"
                          >
                            <InlineStack blockAlign="center" gap="500">
                              <ResourceHeadline resource={selectedResource} theme={theme} />

                              {/* Translation Progress Bar */}
                              <TranslationProgressBar
                                {...calculateTranslationStatus()}
                              />
                            </InlineStack>
                            <Box>
                              <ButtonGroup>
                                <Button
                                  variant="secondary"
                                  onClick={handleTranslation}
                                  loading={isTranslating}
                                >
                                  Auto-translate
                                </Button>
                                {checkedItems.size > 0 && (
                                  <Button
                                    variant="primary"
                                    onClick={handleBulkSave}
                                    loading={isBulkSaving}
                                  >
                                    Save {checkedItems.size} selected
                                  </Button>
                                )}
                              </ButtonGroup>
                            </Box>
                          </InlineStack>

                          {!isTranslationLoaded || isTranslationLoading ? (
                            <SkeletonTranslationContent section={section} />
                          ) : (
                            renderEditSection(selectedResource._path)
                          )}
                        </BlockStack>
                      ) : (
                        renderEmptyState(section)
                        // <SkeletonTranslation section={section} />
                      )}
                    </Box>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Box>
      )}

      <SaveBar id="translation-save-bar">
        <button
          variant="primary"
          onClick={() => {
            submitTranslations();
            shopify.saveBar.hide("translation-save-bar");
          }}
        ></button>
        <button
          id="discard-button"
          onClick={() => {
            // console.log(cleanFormState, editors);
            for (let key in editors) {
              const [transiId, transKey] = key.split("-");
              // Set flag to prevent onUpdate triggered
              if (!editors[key].xtraData) editors[key].xtraData = {};
              editors[key].xtraData.isForcedRollback = true;
              let text = "";
              if (
                cleanFormState[transiId] &&
                cleanFormState[transiId][transKey] &&
                cleanFormState[transiId][transKey]["value"]
              )
                text = cleanFormState[transiId][transKey]["value"];
              editors[key].setData(text);
            }
            formStateDispatch({ type: "init", translations: cleanFormState });
            shopify.saveBar.hide("translation-save-bar");
          }}
        ></button>
      </SaveBar>

      <InsertImageModal editor={{}} />
    </Box>
  );
}
