# Shopify Metafield Migrator

A Node.js script that migrates Shopify Metafield definitions from a source store to a destination store using the Shopify Admin API.

## Getting Started

1.  Clone this repository to your local machine.

2.  Run this to copy the example configuration:
    ```bash
    cp .env.example .env
    npm install
    ```

3.  [Create a custom app inside the Shopify Admin Dashboard](https://help.shopify.com/en/manual/apps/app-types/custom-apps) for the source and destination store. Permissions required: write_metaobject_definitions, read_metaobject_definitions as well as write access to all owner types you want to migrate (customers, orders, content, ...)

4.  Edit the `.env` file with your store information:
    - `API_VERSION`: API version for requests to both stores
    - `ORIGIN_STORE`: Your source store URL (e.g., `my-source-store.myshopify.com`)
    - `ORIGIN_API_TOKEN`: Your source store API access token
    - `DESTINATION_STORE`: Your destination store URL (e.g., `my-dest-store.myshopify.com`)
    - `DESTINATION_API_TOKEN`: Your destination store API access token

5.  Specify the resources for which you want to migrate the metafield definitions by modifying the OWNER_TYPES array in `migrate.js`. Defaults to all common types.

6.  Run the migration using the command `npm start`.

## Usage

The script will migrate the metafield definitions defined in the `OWNER_TYPES` array from the source store to the destination store. It will skip existing metafield definitions.

## Limitations & Considerations

- The script only migrates metafield _definitions_. It does not migrate any metafield values. Use [Matrixify](https://matrixify.app/) instead to migrate resources with corresponding metafield values.
- The script does not handle errors caused by invalid credentials, network issues, or other issues with the Shopify API.
- Tested on Node.js v24.2.0