import { gql } from 'graphql-tag';

export const GET_PRODUCTS = gql`
  query GetProducts($search: String) {
    products(search: $search) {
      id
      name
      sku
      stock
      price
      discount
      purchase
      createdAt
    }
  }
`;

export const GET_PRODUCT = gql`
  query GetProduct($id: String!) {
    product(id: $id) {
      id
      name
      sku
      stock
      price
      discount
      purchase
      createdAt
    }
  }
`;

export const CREATE_PRODUCT_MUTATION = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id
      name
      sku
      stock
      price
      discount
      purchase
      createdAt
    }
  }
`;

export const UPDATE_PRODUCT_MUTATION = gql`
  mutation UpdateProduct($id: String!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id
      name
      sku
      stock
      price
      discount
      purchase
      createdAt
    }
  }
`;

export const DELETE_PRODUCT_MUTATION = gql`
  mutation DeleteProduct($id: String!) {
    deleteProduct(id: $id)
  }
`;
