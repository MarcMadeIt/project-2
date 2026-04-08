import path from "path";
import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Quiz Platform API",
      version: "1.0.0",
      description: "API documentation for the quiz backend",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "UUID",
        },
      },
      schemas: {
        QuizListItem: {
          type: "object",
          properties: {
            id: { type: "string", example: "quiz_datastructures_001" },
            title: { type: "string", example: "Datastrukturer" },
            link: { type: "string", example: "/quizzes/quiz_datastructures_001" },
          },
        },
        QuizListResponse: {
          type: "object",
          properties: {
            quizzes: {
              type: "array",
              items: { $ref: "#/components/schemas/QuizListItem" },
            },
          },
        },
        ChoiceOption: {
          type: "object",
          properties: {
            id: { type: "string", example: "a" },
            text: { type: "string", example: "Queue" },
          },
        },
        PublicSingleChoiceQuestion: {
          type: "object",
          properties: {
            id: { type: "string", example: "ds_q01" },
            type: { type: "string", example: "single_choice" },
            questionText: {
              type: "string",
              example: "Hvilken datastruktur arbejder typisk efter princippet <strong>FIFO</strong>?",
            },
            options: {
              type: "array",
              items: { $ref: "#/components/schemas/ChoiceOption" },
            },
          },
        },
        PublicMultipleChoiceQuestion: {
          type: "object",
          properties: {
            id: { type: "string", example: "ds_q03" },
            type: { type: "string", example: "multiple_choice" },
            questionText: {
              type: "string",
              example: "Hvilke udsagn om et <strong>array</strong> er korrekte?",
            },
            options: {
              type: "array",
              items: { $ref: "#/components/schemas/ChoiceOption" },
            },
          },
        },
        PublicClozeQuestion: {
          type: "object",
          properties: {
            id: { type: "string", example: "ds_q07" },
            type: { type: "string", example: "cloze" },
            questionText: {
              type: "string",
              example: "En datastruktur der lagrer data som nøgle-værdi-par, kaldes ofte en <strong>____</strong>.",
            },
            caseSensitive: { type: "boolean", example: false },
            trimWhitespace: { type: "boolean", example: true },
          },
        },
        PublicQuiz: {
          type: "object",
          properties: {
            id: { type: "string", example: "quiz_datastructures_001" },
            title: { type: "string", example: "Datastrukturer" },
            description: { type: "string" },
            category: { type: "string" },
            difficulty: { type: "string" },
            language: { type: "string" },
            shuffleQuestions: { type: "boolean" },
            shuffleOptions: { type: "boolean" },
            allowedHtmlTags: {
              type: "array",
              items: { type: "string" },
            },
            allowedHtmlStyles: {
              type: "array",
              items: { type: "string" },
            },
            rules: {
              type: "object",
              additionalProperties: true,
            },
            questions: {
              type: "array",
              items: {
                oneOf: [
                  { $ref: "#/components/schemas/PublicSingleChoiceQuestion" },
                  { $ref: "#/components/schemas/PublicMultipleChoiceQuestion" },
                  { $ref: "#/components/schemas/PublicClozeQuestion" },
                ],
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string", example: "Quiz blev ikke fundet." },
          },
        },
      },
    },
  },
  apis: [
    path.join(__dirname, "..", "routes", "*.ts"),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);