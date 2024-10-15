import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

export class RouterGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the backend proxy Lambda function
    const backendProxyFunction = new lambda.Function(this, 'BackendProxyLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')), // Path to lambda folder
      handler: 'backend-proxy-lambda.handler',  // File name and function handler
    });

    // Create a CloudWatch Log Group for API Gateway logs
    const logGroup = new logs.LogGroup(this, 'ApiGatewayAccessLogs', {
      retention: logs.RetentionDays.ONE_WEEK,  // Log retention policy
    });

    // Create the API Gateway and integrate it with the Lambda function
    const api = new apigateway.RestApi(this, 'RouterApi', {
      restApiName: 'RouterGatewayAPI',
      description: 'API Gateway that proxies requests based on paths',
      deployOptions: {
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
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
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,  // Capture full request/response data for troubleshooting
      },
    });

    // Integrate all API Gateway requests with the Lambda function
    const lambdaIntegration = new apigateway.LambdaIntegration(backendProxyFunction);
    
    // Define an API Gateway resource with the path '{proxy+}' to capture all requests
    api.root.addResource('{proxy+}').addMethod('ANY', lambdaIntegration);
  }
}
