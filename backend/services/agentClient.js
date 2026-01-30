const path = require('path');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

const PROTO_PATH = path.join(__dirname, '..', '..', 'agent-service', 'apply_service.proto');
const AGENT_GRPC_URL = process.env.AGENT_GRPC_URL || 'localhost:50051';

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const applyProto = grpc.loadPackageDefinition(packageDefinition).apply;

const client = new applyProto.ApplyService(
  AGENT_GRPC_URL,
  grpc.credentials.createInsecure()
);

const generateCoverLetter = (request) =>
  new Promise((resolve, reject) => {
    client.GenerateCoverLetter(request, (err, response) => {
      if (err) {
        return reject(err);
      }
      return resolve(response);
    });
  });

const answerQuestions = (request) =>
  new Promise((resolve, reject) => {
    client.AnswerQuestions(request, (err, response) => {
      if (err) {
        return reject(err);
      }
      return resolve(response);
    });
  });

const autoApply = (request) =>
  new Promise((resolve, reject) => {
    client.AutoApply(request, (err, response) => {
      if (err) {
        return reject(err);
      }
      return resolve(response);
    });
  });

module.exports = {
  generateCoverLetter,
  answerQuestions,
  autoApply,
};
