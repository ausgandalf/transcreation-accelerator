import {
  useState,
  useEffect,
  useReducer,
  useMemo,
  useCallback,
  useRef,
} from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import {
  useOutletContext,
  useLoaderData,
  useNavigate,
  useNavigation,
  useFetcher,
  useActionData,
  useSubmit,
  useSearchParams,
} from "@remix-run/react";
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

import { authenticate, login } from "../../shopify.server";

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
  getResourceInfo,
  sleep,
} from "app/components/Functions";
import { getProductInfo } from "app/api/GraphQL";
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
  SkeletonTranslation,
  SkeletonTranslationContent,
} from "../../components/Skeletons";

import { ResourcePanel as ProductsPanel } from "./products";
import { ResourcePanel as CollectionsPanel } from "./collections";
import { ResourcePanel as BlogsPanel } from "./blogs";
import { ResourcePanel as ArticlesPanel } from "./articles";

import { SearchPanel } from "./search";

import { sections, transKeys } from "app/api/data";
import { Editor } from "app/components/Editor";
import { InsertImageModal } from "app/components/Editor--CKEditor--InsertImageModal";
import { select } from "@shopify/app-bridge/actions/ResourcePicker";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const url = new URL(request.url);

  const section = params.section;
  let selected: any = false;
  let id = url.searchParams.get("id") ? url.searchParams.get("id") : "";
  // Get id in Shopify eco-system
  id = getIDBySection(id, section);
  if (id) {
    // Load resource info
    selected = await getResourceInfo(admin.graphql, id, section);
  }

  return {
    init: true,
    path: `/localize/${section}`,
    resourceId: id,
    pathSection: section,
    selected,
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

  const intervalRef = useRef<NodeJS.Timeout>(0);
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

  const { init, path, resourceId, pathSection, selected } =
    useLoaderData<typeof loader>();
  // const actionData = useActionData<typeof action>();
  const [section, setSection] = useState(pathSection);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResourceLoading, setIsResourceLoading] = useState(false);
  const [isTranslationLoading, setIsTranslationLoading] = useState(false);
  const [isTranslationLoaded, setIsTranslationLoaded] = useState(false);

  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchKey, setSearchKey] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();

  // const nav = useNavigation();
  // const isSaving =
  //   nav.state === "submitting" && nav.formData?.get("action") !== "save";
  // const isDeleting =
  //   nav.state === "submitting" && nav.formData?.get("action") === "delete";

  // useEffect(() => {
  //   console.log(nav);
  //   setIsLoading(nav.state === "loading");
  // }, [nav])

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

    // getRedirect(shopify).dispatch(
    //   Redirect.Action.APP,
    //   `/?shopLocale=${currentLocale.locale}`,
    // )
  }

  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////

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

  const getTransSourceObj = (resources: [], key: string) => {
    let transObj = {};
    const foundTransObj = resources.some((x) => {
      if (x.key == key) {
        transObj = { ...x };
        return true;
      }
    });
    if (!foundTransObj) {
      // console.log(resources, key);
      throw Error(
        "Unknown translation key found in getTransSourceObj() funciton.",
      );
    }
    return transObj;
  };

  const updateTranslation = (id: string, key: string, translation: string, skipStatusUpdate = false) => {
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

    for (var id in formState) {
      let trans = [];
      for (var key in formState[id]) {
        // let's only push if we have changes
        if (
          JSON.stringify(formState[id][key]) !=
          JSON.stringify(cleanFormState[id][key])
        ) {
          trans.push(formState[id][key]);
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
      id: selectedResource.id,
      market: currentMarket.id,
      marketLabel: currentMarket.name,
      locale: currentLocale.locale,
      action: "trans_submit",
    };
    // console.log('submitting translations ...', data);
    fetcher.submit(data, { action: "/api", method: "post" });
  };

  useEffect(() => {
    // console.log(fetcher);
    if (!fetcher.data) {
    } else {
      
      const resourceReadActions = [
        'product_read',
        'collection_read',
        'blog_read',
        'article_read',
      ];

      if (resourceReadActions.includes(fetcher.data.action)) {
        // TODO
        if (
          fetcher.data.transdata &&
          fetcher.data.resource.id == selectedResource.id
        ) {

          if (fetcher.data.action == 'product_read') {
            setProductInfoIds({ ...fetcher.data.resource });
          } else {
            setResourceInfo({ ...fetcher.data.resource });
          }
          
          setCurrentTranslateMarketLocale(
            fetcher.data.resource.id +
              "-" +
              fetcher.data.input.locale +
              "-" +
              fetcher.data.input.market,
          );
          // Init form state
          let translatableData = {};
          let translatableDataObj = {};
          let transData = {};
          fetcher.data.transdata.map((x, i) => {
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
          setTransIdTypes(fetcher.data.idTypes);

          formStateDispatch({ type: "init", translations: transData });
          setCleanFormState(transData);
          setEditors({});
          // Remove loading anim
          setIsTranslationLoading(false);
          setIsTranslationLoaded(true);
        }
      } else if (fetcher.data.action == "trans_submit") {
        // TODO

        // Reloading...
        // selectResource(selectedResource);

        // Update into new data
        const newTransDataObj = structuredClone(transDataObject);

        fetcher.data.results.map((x, i) => {
          if (x.set && x.set.result && x.set.result && x.set.result) {
            // Update
            const resId = x.set.result.id;
            x.set.result.translations.map((y, j) => {
              newTransDataObj[resId][y.key]["updated"] = y.updatedAt;
              updateTranslation(resId, y.key, y.value);
            });
          }
        });
        setTransDataObject(newTransDataObj);

        setCleanFormState(structuredClone(formState));
        setIsSaving(false);
        shopify.toast.show("The translations have been saved.", {
          duration: 2000,
        });
      }
    }
  }, [fetcher.data]);

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

  const selectResource = (item, searchParamValue = null, path: string = "") => {
    // console.log(item, searchParamValue?.toString(), path);
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
        if (searchParams.get("id") != itemId)
          searchParamValue.set("id", itemId);
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

    const availablePathes = [
      'product',
      'collection',
      'blog',
      'article',
    ];

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
      console.log('path is not available.');
    }
  };

  const loadCurrentResource = () => {
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

  useEffect(() => {
    if (!fetcher.data) return;

    if (fetcher.data.action === "trans_submit") {
      fetcher.data.results.forEach((x) => {
        if (x.set?.result) {
          const resId = x.set.result.id;
          x.set.result.translations.forEach((y) => {
            // Update the translation
            updateTranslation(resId, y.key, y.value, true);

            // Update status to confirmed
            setTranslationStatus((prev) => ({
              ...prev,
              [`${resId}-${y.key}`]: "confirmed",
            }));

            // Clear saving state for this specific item
            setSavingItems((prev) => ({
              ...prev,
              [`${resId}-${y.key}`]: false,
            }));
          });
        }
      });

      setCleanFormState(structuredClone(formState));
      setIsSaving(false);
      shopify.toast.show("The translations have been saved.", {
        duration: 2000,
      });
    }
  }, [fetcher.data]);

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
      return makeReadable(key);
    }
  }

  const renderTransSource = (type: string, value: string) => {
    if (type == "HTML") {
      return <Editor text={value} readOnly={true} />;
      return;
    } else {
      return <Text as="p">{value}</Text>;
    }
  };

  const renderTransEditor = (type: string, id: string, key: string) => {
    let editorObj;
    if (type == "HTML") {
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

  const renderSelectedResourceHeadline = (resource: any) => {
    const _path = resource._path;
    const showingImage = ["product", "collection", "article"].indexOf(_path) > -1;
    let imageUrl = "";
    if (showingImage) {
      if (_path == "product") {
        imageUrl = resource.image
          ? resource.image.preview.image.url + "&width=24"
          : "";
      } else if (_path == "collection") {
        imageUrl = resource.image ? resource.image.url + "&width=24" : "";
      } else if (_path == "article") {
        imageUrl = resource.image ? resource.image.url + "&width=24" : "";
      }
    }
    return (
      <InlineStack gap="200">
        {showingImage && (
          <Thumbnail
            source={imageUrl ? imageUrl : ImageIcon}
            size="small"
            alt={resource.title}
          />
        )}

        <a
          className="link--external"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            if (_path == "product") {
              getRedirect(shopify).dispatch(Redirect.Action.ADMIN_SECTION, {
                section: {
                  name: Redirect.ResourceType.Product,
                  resource: {
                    id: resource.id.split("/").pop(),
                  },
                },
                newContext: true,
              });
            } else if (_path == "collection") {
              getRedirect(shopify).dispatch(Redirect.Action.ADMIN_SECTION, {
                section: {
                  name: Redirect.ResourceType.Collection,
                  resource: {
                    id: resource.id.split("/").pop(),
                  },
                },
                newContext: true,
              });
            } else if (_path == "blog") {
              // TODO
              getRedirect(shopify).dispatch(Redirect.Action.ADMIN_PATH, {
                path: '/blogs/' + resource.id.split("/").pop(),
                newContext: true,
              });
            } else if (_path == "article") {
              // TODO
              getRedirect(shopify).dispatch(Redirect.Action.ADMIN_PATH, {
                path: '/articles/' + resource.id.split("/").pop(),
                newContext: true,
              });
            }
          }}
        >
          <InlineStack wrap={false} gap="200">
            <Text as="h2" variant="headingLg">
              {resource.title}
            </Text>
            <Icon source={ExternalIcon} />
          </InlineStack>
        </a>
      </InlineStack>
    );
  };

  const renderEmptyState = (path: string) => {

    return (
      <EmptyState
        heading={'No ' + makeReadable(path) + ' found.'}
        image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
      >
        {path == 'article' && (<Button onClick={() => {
          getRedirect(shopify).dispatch(Redirect.Action.ADMIN_PATH, {
            path: '/content/articles',
            newContext: true,
          });
        }}>Add blog post</Button>)}

        {!['article'].includes(path) && (<Button onClick={() => {
          getRedirect(shopify).dispatch(Redirect.Action.ADMIN_PATH, {
            path: '/' + path + 's',
            newContext: true,
          });
        }}>Add {path}</Button>)}

      </EmptyState>
    )
  }
  
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
                          <Checkbox label="" />
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
                        <Text as="p">Apr 1, 2025 - 11:28</Text>
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
                          <Checkbox label="" />
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
                        <Text as="p">Apr 1, 2025 - 11:28</Text>
                      </td>
                      <td style={cellStyle}>{renderStatus(x.id, "name")}</td>
                      <td style={cellStyle}>
                        {renderActionButtons(x.id, "name")}
                      </td>
                    </tr>

                    {x.optionValues.map((ov, j) => (
                      <tr key={"transopt-tr-ov--" + i + "-" + j}>
                        {j === 0 ? (
                          <td
                            style={{ ...cellStyle }}
                            rowSpan={x.optionValues.length}
                          >
                            <InlineStack
                              gap="200"
                              align="start"
                              blockAlign="start"
                            >
                              <Checkbox label="" />
                              <BlockStack gap="100">
                                <Text as="p" variant="headingSm">
                                  {x.name}
                                </Text>
                                <Text as="p" tone="subdued" variant="bodySm">
                                  Option values
                                </Text>
                                <Text as="p" tone="subdued" variant="bodySm">
                                  Source:{" "}
                                  {getLanguageLabel(
                                    transDataObject[ov.id]["name"].locale,
                                  )}
                                </Text>
                              </BlockStack>
                            </InlineStack>
                          </td>
                        ) : (
                          <td />
                        )}

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
                          <Text as="p">Apr 1, 2025 - 11:28</Text>
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

        {['collection', 'blog', 'article'].includes(path) && (
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
                            <Checkbox label="" />
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
                        <td style={cellStyle}>{renderStatus(resourceInfo.id, x.key)}</td>
                        <td style={cellStyle}>
                          {renderActionButtons(resourceInfo.id, x.key)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </Card>
          </BlockStack>
        )}
      </div>
    );
  };
  ///////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////

  // Add these helper functions for localStorage
  const getStoredTranslations = () => {
    if (typeof window === "undefined") return {};
    try {
      const stored = window.localStorage.getItem("translationStatus");
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error("Error reading from localStorage:", e);
      return {};
    }
  };

  const getStoredPreviousValues = () => {
    if (typeof window === "undefined") return {};
    try {
      const stored = window.localStorage.getItem("previousValues");
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error("Error reading from localStorage:", e);
      return {};
    }
  };

  // Add new state declarations
  const [translationStatus, setTranslationStatus] = useState(() =>
    getStoredTranslations(),
  );
  const [preSaveValues, setPreSaveValues] = useState(() =>
    getStoredPreviousValues(),
  );
  const [editorResetCount, setEditorResetCount] = useState(0);
  const [savingItems, setSavingItems] = useState<{ [key: string]: boolean }>(
    {},
  );
  const [translatingItems, setTranslatingItems] = useState<{
    [key: string]: boolean;
  }>({});
  const [originalTranslations, setOriginalTranslations] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);

  // Add localStorage effects
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "translationStatus",
        JSON.stringify(translationStatus),
      );
    } catch (e) {
      console.error("Error saving translation status:", e);
    }
  }, [translationStatus]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "previousValues",
        JSON.stringify(preSaveValues),
      );
    } catch (e) {
      console.error("Error saving previous values:", e);
    }
  }, [preSaveValues]);

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

    setPreSaveValues((prev) => ({
      ...prev,
      [`${id}-${key}`]: lastSavedValue,
    }));

    setSavingItems((prev) => ({
      ...prev,
      [`${id}-${key}`]: true,
    }));

    const translation = {
      id,
      data: [formState[id][key]],
    };

    const data = {
      translations: JSON.stringify([translation]),
      id: selectedResource.id,
      market: currentMarket.id,
      locale: currentLocale.locale,
      action: "trans_submit",
    };

    fetcher.submit(data, { action: "/api", method: "post" });
  };

  // Update handleTranslationUndo
  const handleTranslationUndo = (id: string, key: string) => {
    const previousValue = preSaveValues[`${id}-${key}`];
    console.log("Attempting to restore to previous value:", previousValue);

    if (previousValue !== undefined) {
      console.log("Restoring to:", previousValue);
      updateTranslation(id, key, previousValue, true);

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
    }
  };

  // Update handleTranslationRejection
  const handleTranslationRejection = (id: string, key: string) => {
    const originalValue = originalTranslations[`${id}-${key}`] || "";
    updateTranslation(id, key, originalValue);

    setTranslationStatus((prev) => ({
      ...prev,
      [`${id}-${key}`]: "rejected",
    }));
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
    const translationKey = `${id}-${key}`;
    
    // Check if this is a confirmed field that has been edited
    const isEdited = info.status === "confirmed" && 
      cleanFormState[id]?.[key]?.value !== undefined && 
      cleanFormState[id][key].value !== info.current;

    if (isTranslating) {
      return (
        <Badge progress="partiallyComplete" tone="info">
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
        <Badge tone="warning" progress="incomplete">
          <Text as="span" fontWeight="bold">
            Needs attention
          </Text>
        </Badge>
      );
    } else {
      return (
        <Badge tone="critical">
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
    const isEdited = info.status === "confirmed" && 
      cleanFormState[id]?.[key]?.value !== undefined && 
      cleanFormState[id][key].value !== info.current;

    const isConfirmed = info.status === "confirmed" && !isEdited;
    const isSaving = savingItems[`${id}-${key}`] === true;
    const isTranslating = translatingItems[`${id}-${key}`] === true;

    const canSave =
      hasChanges || needsAttention || (hasTranslation && !info.status) || isEdited;

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
                  <InlineStack
                    gap="100"
                    align="center"
                    blockAlign="center"
                    wrap={false}
                  >
                    {!isSearchVisible && context.selectors}
                    {isSearchVisible && (
                      <div style={{ flex: "0 0 calc(100% - 200px)" }}>
                        <TextField
                          label="Search by keyword"
                          labelHidden
                          focused
                          placeholder="Search by keyword"
                          minLength={100}
                          value={searchKey}
                          onChange={(value) => setSearchKey(value)}
                          autoComplete="off"
                        />
                      </div>
                    )}
                    <Box>
                      {!isSearchVisible && (
                        <Button
                          icon={SearchIcon}
                          onClick={() => setIsSearchVisible(true)}
                        />
                      )}
                      {isSearchVisible && (
                        <Button onClick={() => setIsSearchVisible(false)}>
                          Cancel
                        </Button>
                      )}
                    </Box>
                  </InlineStack>
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

                  <SyncRunner asButton />

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
                      {selectedResource ? (
                        <BlockStack gap="400">
                          <InlineStack
                            align="space-between"
                            blockAlign="center"
                          >
                            {renderSelectedResourceHeadline(selectedResource)}
                            <Box>
                              <Button
                                variant="secondary"
                                onClick={handleTranslation}
                                loading={isTranslating}
                              >
                                Auto-translate
                              </Button>
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
