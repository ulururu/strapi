'use strict';

module.exports = () => ({
  graphql: {
    enabled: true,
    config: {
      endpoint: '/graphql',

      defaultLimit: 25,
      maxLimit: 100,

      apolloServer: {
        tracing: true,
      },

      v4CompatibilityMode: true,
    },
  },
  documentation: {
    config: {
      info: {
        version: '1.0.0',
      },
    },
  },
  myplugin: {
    enabled: true,
    resolve: `./src/plugins/local-plugin`, // From the root of the project
    config: {
      testConf: 3,
    },
  },
  upload: {
    enabled: true,
    resolve: "../../packages/providers/upload-upyun",
    config: {
      provider: "@strapi/provider-upload-upyun",
      providerOptions: {
        serviceName: "uluru",
        operatorName: "lukasu",
        password: "SSTIoLciLJxnAGwiGkIWTHBJPBPl36jC",
        baseUrl: "https://i.uluru.ru/",
        uploadPath: "test",
      },
      breakpoints: {
        large: 1920,
        medium: 750,
      },
    },
  },
  // NOTE: set enabled:true to test with a pre-built plugin. Make sure to run yarn build in the plugin folder first
  todo: {
    enabled: false,
    resolve: `../plugins/todo-example`, // From the /examples/plugins folder
  },
});
