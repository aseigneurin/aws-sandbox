const AWS = require("aws-sdk")

AWS.config.update({
    region: "us-east-1"
})

const docClient = new AWS.DynamoDB.DocumentClient()

exports.handler = (event, context, callback) => {
    console.log("event:", JSON.stringify(event, null, 2))
    console.log("context:", JSON.stringify(context, null, 2))

    const results = listEvents((results) => {
        console.log("results:", JSON.stringify(results, null, 2))
    
        const response = {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": JSON.stringify(results, null, 2),
            "isBase64Encoded": false
        }
        console.log("response:", JSON.stringify(response, null, 2))
    
        callback(null, response)
    })
}

function listEvents(callback) {
    const params = {
        TableName: "text-to-speech"
    }

    docClient.scan(params, function (err, data) {
        if (err) {
            console.error("Unable to query. Error JSON:", JSON.stringify(err, null, 2))
        } else {
            console.log("Results:", JSON.stringify(data, null, 2))
            callback(data)
        }
    })
}
