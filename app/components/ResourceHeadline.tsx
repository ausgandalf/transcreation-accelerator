import { InlineStack, Text, Thumbnail, Icon } from "@shopify/polaris";
import { ExternalIcon, ImageIcon } from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";

interface ResourceHeadlineProps {
  resource: any;
  theme: any;
}

export function ResourceHeadline({ resource, theme }: ResourceHeadlineProps) {
  const shopify = useAppBridge();
  const getRedirect = (app: any) => Redirect.create(app);

  const _path = resource._path;
  const showingImage =
    ["product", "collection", "article"].indexOf(_path) > -1;
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

  let title = resource.title;
  if (
    ["theme", "template", "static", "section"].indexOf(_path) > -1
  ) {
    title = theme.name;
  } else if (_path == 'content') {
    title = theme.name + ' - ' + resource.title;
  }

  let targetUrl = "";
  if (_path == "product") {
    targetUrl = "/products/" + resource.id.split("/").pop();
  } else if (_path == "collection") {
    targetUrl = "/collections/" + resource.id.split("/").pop();
  } else if (_path == "blog") {
    targetUrl = "/blogs/" + resource.id.split("/").pop();
  } else if (_path == "article") {
    targetUrl = "/articles/" + resource.id.split("/").pop();
  } else if (_path == "page") {
    targetUrl = "/pages/" + resource.id.split("/").pop();
  } else if (_path == "policy") {
    targetUrl = "/settings/legal";
  } else if (_path == "metaobject") {
    targetUrl =
      "/content/metaobjects/entries/null/" + resource.id.split("/").pop();
  } else if (
    ["theme", "template", "static", "section", "content"].indexOf(_path) > -1
  ) {
    targetUrl = `/themes/${theme.rawId}/editor`;
  } else if (_path == "content") {
    targetUrl = `/themes/${theme.rawId}/language`;
  }

  return (
    <InlineStack gap="200">
      {showingImage && (
        <Thumbnail
          source={imageUrl ? imageUrl : ImageIcon}
          size="small"
          alt={title}
        />
      )}

      {targetUrl != "" ? (
        <a
          className="link--external"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            getRedirect(shopify).dispatch(Redirect.Action.ADMIN_PATH, {
              path: targetUrl,
              newContext: true,
            });
          }}
        >
          <InlineStack wrap={false} gap="200">
            <Text as="h2" variant="headingLg">
              {title}
            </Text>
            <Icon source={ExternalIcon} />
          </InlineStack>
        </a>
      ) : (
        <Text as="h2" variant="headingLg">
          {title}
        </Text>
      )}
    </InlineStack>
  );
} 