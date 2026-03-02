'use client';

import { ApolloClient, InMemoryCache, from } from '@apollo/client/core';
import { HttpLink } from '@apollo/client/link/http';
import { setContext } from '@apollo/client/link/context';

let client: ApolloClient | undefined;

function createApolloClient() {
  const httpLink = new HttpLink({
    uri: 'http://localhost:4000/graphql',
  });

  const authLink = setContext((_, { headers }) => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('slooze_token')
        : null;
    return {
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  });

  return new ApolloClient({
    link: from([authLink, httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      watchQuery: { fetchPolicy: 'cache-and-network' },
    },
  });
}

export function getApolloClient() {
  if (!client) {
    client = createApolloClient();
  }
  return client;
}

export function resetApolloClient() {
  if (client) {
    client.clearStore();
    client = undefined;
  }
}
