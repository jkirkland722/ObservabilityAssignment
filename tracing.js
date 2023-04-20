const { Resource } = require("@opentelemetry/resources");
const { SemanticResourceAttributes } = 
require("@opentelemetry/semantic-conventions");
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');
const { SimpleSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const { trace } = require("@opentelemetry/api");
const { JaegerExporter } = require('@opentelemetry/exporter-jaeger');
//Instrumentations
const { ExpressInstrumentation } = 
require("opentelemetry-instrumentation-express");
const { MongoDBInstrumentation } = 
require("@opentelemetry/instrumentation-mongodb");
const { HttpInstrumentation } = 
require("@opentelemetry/instrumentation-http");
const { registerInstrumentations } = 
require("@opentelemetry/instrumentation");
//Exporter
module.exports = (serviceName) => {
    const { initTracer } = require('jaeger-client');
    const config = {
        serviceName: serviceName,
        sampler: {
          type: 'const',
          param: 1,
        },
        reporter: {
            endpoint: 'http://localhost:14268/api/traces',
          collectorEndpoint: 'http://localhost:14268/api/traces',
          logSpans: true,
        },
    };
    const tracer = initTracer(config);

    const exporter = new JaegerExporter({
        serviceName: serviceName,
        host: 'localhost',
        port: 6832,
    });

    const provider = new NodeTracerProvider({
        tracer: tracer,
        resource: new Resource({
           [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
       }),
    });
    provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    provider.register();
    registerInstrumentations({
       instrumentations: [
           new HttpInstrumentation(),
           new ExpressInstrumentation(),
           new MongoDBInstrumentation(),
       ],
       tracerProvider: provider,
    });
    return trace.getTracer(serviceName);
};
