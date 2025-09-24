import axios from "axios";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

// Setup the type of resources for which you want to migrate the metafield defintions. Defaults to all.
// More information: https://shopify.dev/docs/api/admin-graphql/latest/enums/MetafieldOwnerType

const OWNER_TYPES = [
  "API_PERMISSION",
  "COMPANY",
  "COMPANY_LOCATION",
  "PAYMENT_CUSTOMIZATION",
  "VALIDATION",
  "CUSTOMER",
  "DELIVERY_CUSTOMIZATION",
  "DRAFTORDER",
  "GIFT_CARD_TRANSACTION",
  "MARKET",
  "CARTTRANSFORM",
  "COLLECTION",
  "MEDIA_IMAGE",
  "PRODUCT",
  "PRODUCTVARIANT",
  "SELLING_PLAN",
  "ARTICLE",
  "BLOG",
  "PAGE",
  "FULFILLMENT_CONSTRAINT_RULE",
  "ORDER_ROUTING_LOCATION_RULE",
  "DISCOUNT",
  "ORDER",
  "LOCATION",
  "SHOP"
];

// Setup a custom app inside the Shopify Admin Dashboard for the source and destination store. Grant the app the permission to read and write metafield/metaobject definitions and grant write access to all affected resources.
// More information: https://help.shopify.com/en/manual/apps/app-types/custom-apps

const SOURCE = {
  STORE: process.env.ORIGIN_STORE,
  SHOPIFY_TOKEN: process.env.ORIGIN_API_TOKEN,
  SHOPIFY_API_VER: process.env.API_VERSION,
};

const DESTINATION = {
  STORE: process.env.DESTINATION_STORE,
  SHOPIFY_TOKEN: process.env.DESTINATION_API_TOKEN,
  SHOPIFY_API_VER: process.env.API_VERSION,
};

const queryShopify = async (store, query, variables) => {
  try {
    const response = await axios({
      url: `https://${store.STORE}/admin/api/${store.SHOPIFY_API_VER}/graphql.json`,
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": store.SHOPIFY_TOKEN,
        ContentType: "application/json",
      },
      data: {
        query,
        variables,
      },
    });
    if (response.error) {
      throw new Error("Error accessing graphql");
    }
    return response.data.data;
  } catch (error) {
    throw new Error(`Error querying ${store.STORE}: ${error.message}`);
  }
};

OWNER_TYPES.forEach(async (OWNER_TYPE) => {
  const queryResponse = await queryShopify(
    SOURCE,
    `
  {
    metafieldDefinitions(first: 250, ownerType: ${OWNER_TYPE}) {
      edges {
        node {
          name
          description
          key
          namespace
          ownerType
          type{
            name
          }
          validations {
            name
            type
            value
          }
        }
      }
    }
  }
`
  );
  if (!queryResponse?.metafieldDefinitions?.edges?.length > 0) {
    console.log(
      `Error fetching metafield definitions for owner type: ${OWNER_TYPE}`
    );
    return;
  }
  const metafieldDefinitions = queryResponse.metafieldDefinitions.edges.map(
    (node) => node.node
  );

  metafieldDefinitions.forEach(async (definition) => {
    const creationResponse = await queryShopify(
      DESTINATION,
      `
  mutation metafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`,
      {
        definition: {
          description: definition.description,
          key: definition.key,
          name: definition.name,
          namespace: definition.namespace,
          ownerType: definition.ownerType,
          pin: definition.pin,
          type: definition.type.name,
          validations: definition.validations.map((validation) => {
            return {
              name: validation.name,
              value: validation.value,
            };
          }),
          visibleToStorefrontApi: definition.visibleToStorefrontApi,
        },
      }
    );
    if (creationResponse.metafieldDefinitionCreate?.userErrors?.length > 0)
      console.log(
        `Failed to copy metafield definition with key ${definition.key} because ${creationResponse.metafieldDefinitionCreate.userErrors[0].message}`
      );
  });
});
