const AWS = require("aws-sdk")

AWS.config.update({
    region: "us-east-1"
})

exports.handler = (event, context, callback) => {
    console.log("event:", JSON.stringify(event, null, 2))
    console.log("context:", JSON.stringify(context, null, 2))
    
    const id = storeEvent(event.body)

    const responseBody = {
        "id": id
    }
    const response = {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": JSON.stringify(responseBody),
        "isBase64Encoded": false
    }
    callback(null, response)
}

function storeEvent(text) {
    const id = uuidv4()
    const date = new Date().getTime()

    const params = {
        TableName: "text-to-speech",
        Item: {
            "id": id,
            "text": text,
            "date": date,
            "status": "Submitted"
        }
    }

    console.log("Adding a new item...")
    const documentClient = new AWS.DynamoDB.DocumentClient()
    documentClient.put(params, function (err, data) {
        if (err) {
            console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2))
        } else {
            console.log("Added item:", JSON.stringify(data, null, 2))
        }
    })

    return id
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}
