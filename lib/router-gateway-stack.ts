import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';

export class RouterGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a CloudWatch Log Group for API Gateway logs
    const logGroup = new logs.LogGroup(this, 'ApiGatewayAccessLogs', {
      retention: logs.RetentionDays.ONE_WEEK,  // Log retention policy
    });

    // Create the API Gateway
    const api = new apigateway.RestApi(this, 'RouterApi', {
      restApiName: 'RouterGatewayAPI',
      description: 'API Gateway that proxies requests to router.robotlab-x.com',
      deployOptions: {
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),  // Enable access logging
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
        // Enable execution logging (INFO level)
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true, // Logs full request/response data
      },
    });

    // Define the proxy integration to forward any request
    const integration = new apigateway.HttpIntegration('https://router.robotlab-x.com/{proxy}', {
      proxy: true,
      options: {
        requestParameters: {
          'integration.request.path.proxy': 'method.request.path.proxy',
        },
      },
    });

    // Add the ANY method to catch all HTTP methods and proxy the request
    api.root.addMethod('ANY', integration, {
      requestParameters: {
        'method.request.path.proxy': true,
      },
    });

    // Enable proxy for all sub-paths
    api.root.addResource('{proxy+}').addMethod('ANY', integration, {
      requestParameters: {
        'method.request.path.proxy': true,
      },
    });
  }
}
