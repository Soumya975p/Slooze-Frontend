import { gql } from 'graphql-tag';

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      access_token
      user {
        id
        email
        role
      }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($email: String!, $password: String!, $role: Role) {
    register(email: $email, password: $password, role: $role) {
      access_token
      user {
        id
        email
        role
      }
    }
  }
`;

export const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      role
    }
  }
`;
