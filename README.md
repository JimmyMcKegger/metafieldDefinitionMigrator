# Shopify Metafield Migrator

A Node.js script that migrates Shopify Metafield definitions from a source store to a destination store using the Shopify Admin API.

## Getting Started

1.  Clone this repository to your local machine.

2.  Install the dependencies by running `npm install` in the project directory.

3.  [Create a custom app inside the Shopify Admin Dashboard](https://help.shopify.com/en/manual/apps/app-types/custom-apps) for the source and destination store. Permissions required: write_metaobject_definitions, read_metaobject_definitions all well as write access to all owner types you want to migrate (customers, orders, content, ...)

4.  Replace the STORE, SHOPIFY_TOKEN and SHOPIY_API_VER constants for the source and destination store inside the migrate.js file.

5.  Run the script using the command `npm start`.

## Usage

The script will migrate the metafield definitions defined in the `OWNER_TYPES` array from the source store to the destination store. It will skip existing metafield definitions.

## Limitations & Considerations

- The script only migrates metafield _definitions_. It does not migrate any metafield values. Use [Matrixify](https://matrixify.app/) instead to migrate resources with corresponding metafield values.
- The script does not handle errors caused by invalid credentials, network issues, or other issues with the Shopify API.
- Tested on Node.js v16.15.1
