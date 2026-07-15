/**
 * Metro/babel-preset-expo statically replace `process.env.NODE_ENV` in app
 * bundles, and Jest provides a real `process`. Declare just that surface
 * rather than pulling all of @types/node into a React Native app.
 */
declare const process: {
  env: {
    NODE_ENV?: 'development' | 'production' | 'test';
    /** Expo inlines EXPO_PUBLIC_* vars at build time. Never secret. */
    EXPO_PUBLIC_API_MODE?: string;
    EXPO_PUBLIC_API_BASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_URL?: string;
    EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  };
};
