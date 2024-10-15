import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class RouterGatewayStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create an API Gateway with a proxy integration
    const api = new apigateway.RestApi(this, 'RouterApi', {
      restApiName: 'RouterGatewayAPI',
      description: 'API Gateway that proxies requests to router.robotlab-x.com',
    });

    // Define the proxy integration to forward any request
    const integration = new apigateway.HttpIntegration('https://router.robotlab-x.com/{proxy}', {
      proxy: true, // Enable proxying to the backend URL
      options: {
        requestParameters: {
          'integration.request.path.proxy': 'method.request.path.proxy', // Pass through the path
        },
      },
    });

    // Add the ANY method to catch all HTTP methods and proxy the request
    api.root.addMethod('ANY', integration, {
      requestParameters: {
        'method.request.path.proxy': true, // Allow all paths to be proxied
      },
    });

    // Enable proxy for all sub-paths (e.g., /foo, /bar)
    api.root.addResource('{proxy+}').addMethod('ANY', integration, {
      requestParameters: {
        'method.request.path.proxy': true,
      },
    });
  }
}
