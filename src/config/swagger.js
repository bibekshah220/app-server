const swaggerJsDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Social Commerce Aggregator API",
      version: "1.0.0",
      description:
        "API Documentation for the Social Commerce Aggregator Marketplace",
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/modules/**/*.routes.js", "./src/docs/*.js"],
};

const swaggerDocs = swaggerJsDoc(options);

module.exports = swaggerDocs;
