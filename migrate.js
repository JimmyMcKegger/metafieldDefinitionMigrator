import axios from "axios";

// Setup the type of resources for which you want to migrate the metafield defintions. Defaults to all.
// More information: https://shopify.dev/docs/api/admin-graphql/2023-01/enums/MetafieldOwnerType

const OWNER_TYPES = [
  "ARTICLE",
  "BLOG",
  "COLLECTION",
  "CUSTOMER",
  "COMPANY",
  "COMPANY_LOCATION",
  "DRAFTORDER",
  "LOCATION",
  "ORDER",
  "PAGE",
  "PRODUCT",
  "PRODUCTIMAGE",
  "PRODUCTVARIANT",
  "SHOP",
];

// Setup a custom app inside the Shopify Admin Dashboard for the source and destination store. Grant the app the permission to read and write metafield/metaobject definitions and grant write access to all affected resources.
// More information: https://help.shopify.com/en/manual/apps/app-types/custom-apps

const SOURCE = {
  STORE: "source.myshopify.com",
  SHOPIFY_TOKEN: "",
  SHOPIFY_API_VER: "2023-01",
};

const DESTINATION = {
  STORE: "destination.myshopify.com",
  SHOPIFY_TOKEN: "",
  SHOPIFY_API_VER: "2023-01",
};

const queryShopify = async (store, query, variables) => {
  try {
    const response = await axios({
      url: `https://${store.STORE}/admin/api/${store.SHOPIFY_API_VER}/graphql.json`,
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": store.SHOPIFY_TOKEN,
        Accept: "application/json",
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
    metafieldDefinitions(first: 20, ownerType: ${OWNER_TYPE}) {
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
