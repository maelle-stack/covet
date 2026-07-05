/**
 * Metro/babel-preset-expo statically replace `process.env.NODE_ENV` in app
 * bundles, and Jest provides a real `process`. Declare just that surface
 * rather than pulling all of @types/node into a React Native app.
 */
declare const process: {
  env: {
    NODE_ENV?: 'development' | 'production' | 'test';
  };
};
