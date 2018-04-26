var https = require('https');
var querystring = require('querystring');

exports.handler = function (request, context) {
    //log("DEBUG:", "handler",  JSON.stringify(request));
    
    if (request.directive.header.namespace === 'Alexa.Discovery' && request.directive.header.name === 'Discover') {
        //log("DEBUG:", "Discover request",  JSON.stringify(request));
        handleDiscovery(request, context, "");
    }
    else if (request.directive.header.namespace === 'Alexa.PowerController') {
        if (request.directive.header.name === 'TurnOn' || request.directive.header.name === 'TurnOff') {
            //log("DEBUG:", "TurnOn or TurnOff Request", JSON.stringify(request));
            handlePowerControl(request, context);
        }
    }

    function handleDiscovery(request, context) {
        var payload = {
            "endpoints": [
                {
                    "endpointId": "endpoint-001",
                    "manufacturerName": "Sample Manufacturer",
                    "friendlyName": "MVI Light",
                    "description": "Switch MVI Light can only be turned on/off",
                    "displayCategories": [
                        "SWITCH"
                    ],
                    "cookie": {
                        "detail1": "For simplicity, this is the only appliance",
                        "detail2": "that has some values in the additionalApplianceDetails"
                    },
                    "capabilities": [
                        {
                            "type": "AlexaInterface",
                            "interface": "Alexa",
                            "version": "3"
                        },
                        {
                            "type": "AlexaInterface",
                            "interface": "Alexa.PowerController",
                            "version": "3",
                            "properties": {
                                "supported": [
                                    {
                                        "name": "powerState"
                                    }
                                ],
                                "proactivelyReported": true,
                                "retrievable": true
                            }
                        },
                        {
                            "type": "AlexaInterface",
                            "interface": "Alexa.EndpointHealth",
                            "version": "3",
                            "properties": {
                                "supported": [
                                    {
                                        "name": "connectivity"
                                    }
                                ],
                                "proactivelyReported": true,
                                "retrievable": true
                            }
                        }
                    ]
                }
            ]
        };
        var header = request.directive.header;
        header.name = "Discover.Response";
        //log("DEBUG", "Discovery Response: ", JSON.stringify({ header: header, payload: payload }));
        context.succeed({ event: { header: header, payload: payload } });
    }

    function log(message, message1, message2) {
        console.log(message + message1 + message2);
    }
    
    function stubControlFunctionToYourCloud(path, powerResult, request, context) {
        var postData = querystring.stringify({'msg' : powerResult});    
        var hostname = "your server name";
        var options = {
            hostname: hostname,
            port: 443,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length
            }
        };
        
        var req = https.request(options, function(res) {
            console.log('statusCode:', res.statusCode);
            handlePowerContext(powerResult, request, context);
            
            res.setEncoding('utf8');
            res.on('data', function(data) {
                /* if you use context.succeed(response); the Receive data will be interrupt */
                console.log('Receive:' + data);
            });
        });
        
        req.on('error', function(error){
            console.error(error);
        });
        
        /* you need to post data */
        req.write(postData);
        req.end();
    }
    
    function handlePowerContext(powerResult, request, context) {
        var contextResult = {
            "properties": 
            [{
                "namespace": "Alexa.PowerController",
                "name": "powerState",
                "value": powerResult,
                "uncertaintyInMilliseconds": 200
            },            
            {
                "namespace": "Alexa.EndpointHealth",
                "name": "connectivity",
                "value": {
                    "value": "OK"
                },
                "timeOfSample": "2017-09-27T18:30:30.45Z",
                "uncertaintyInMilliseconds": 200
            }]
        };

        var responseHeader = request.directive.header;
        responseHeader.name = "Alexa.Response";
        responseHeader.messageId = responseHeader.messageId + "-R";
        var response = {
            context: contextResult,
            event: {
                header: {
                    "namespace": "Alexa",
                    "name": "Response",
                    "payloadVersion": "3",
                    "messageId": "5f8a426e-01e4-4cc9-8b79-65f8bd0fd8a4",
                    "correlationToken": "dFMb0z+PgpgdDmluhJ1LddFvSqZ/jCc8ptlAKulUj90jSqg=="                    
                },
                endpoint:{
                    "scope": {
                    "type": "BearerToken",
                    "token": "access-token-from-Amazon"
                    },
                    "endpointId": "endpoint-001"
                },
                payload: {}
            }
        };
        
        log("DEBUG", "Alexa.PowerController ", JSON.stringify(response));
        context.succeed(response);
    }

    function handlePowerControl(request, context) {                
        // get device ID passed in during discovery
        var requestMethod = request.directive.header.name;
        
        // get user token pass in request
        //var requestToken = request.directive.payload.scope.token;
        //console.log("requestToken = " + requestToken);
        
        var powerResult;
        var path = 'your cloud server path ...';
        if (requestMethod === "TurnOn") {

            // Make the call to your device cloud for control 
            // powerResult = stubControlFunctionToYourCloud(endpointId, token, request);            
            stubControlFunctionToYourCloud(path, "ON", request, context);
            //powerResult = "ON";
        }
       else if (requestMethod === "TurnOff") {
            // Make the call to your device cloud for control and check for success 
            // powerResult = stubControlFunctionToYourCloud(endpointId, token, request);
            stubControlFunctionToYourCloud(path, "OFF", request, context);
            //powerResult = "OFF";
        }
    }
};

