const AWS = require("aws-sdk")

AWS.config.update({
    region: "us-east-1"
})

exports.handler = (event, context, callback) => {
    console.log("event:", JSON.stringify(event, null, 2))
    console.log("context:", JSON.stringify(context, null, 2))

    // example event:
    // {
    //     "Records": [
    //         {
    //             "eventID": "bc73074c33d43fe18c67582aca5f0269",
    //             "eventName": "INSERT",
    //             "eventVersion": "1.1",
    //             "eventSource": "aws:dynamodb",
    //             "awsRegion": "us-east-1",
    //             "dynamodb": {
    //                 "ApproximateCreationDateTime": 1520707620,
    //                 "Keys": {
    //                     "id": {
    //                         "S": "2b99e785-cb84-4f68-8207-0f7c6c337a01"
    //                     }
    //                 },
    //                 "NewImage": {
    //                     "date": {
    //                         "N": "1520707669954"
    //                     },
    //                     "id": {
    //                         "S": "2b99e785-cb84-4f68-8207-0f7c6c337a01"
    //                     },
    //                     "text": {
    //                         "S": "a"
    //                     },
    //                     "status": {
    //                         "S": "Submitted"
    //                     }
    //                 },
    //                 "SequenceNumber": "667100000000015592131049",
    //                 "SizeBytes": 108,
    //                 "StreamViewType": "NEW_AND_OLD_IMAGES"
    //             },
    //             "eventSourceARN": "arn:aws:dynamodb:us-east-1:848610157907:table/text-to-speech/stream/2018-03-10T18:44:31.814"
    //         }
    //     ]
    // }

    event.Records.map((record) => processRecord(record))
}

function processRecord(record) {
    console.log("processRecord:", JSON.stringify(record, null, 2))

    if (record.eventName !== "INSERT") {
        console.log("Not an insert, skipping")
        return
    }

    const event = record.dynamodb.NewImage
    if (event.status.S !== "Submitted") {
        console.log("Not a new text submission, skipping")
        return
    }

    const id = event.id.S
    const text = event.text.S

    updateRecordInDynamo(id, "Processed", () => {
        synthesizeSpeech(id, text, (id, data) => {
            uploadToS3(id, data, () => {
                updateRecordInDynamo(id, "Processed", () => { })
            })
        })
    })
}

function synthesizeSpeech(id, text, callback) {
    console.log("Synthesizing speech...")
    const params = {
        OutputFormat: "mp3",
        SampleRate: "8000",
        Text: text,
        TextType: "text",
        VoiceId: "Joanna"
    }
    const polly = new AWS.Polly()
    polly.synthesizeSpeech(params, function (err, data) {
        if (err) throw(err)
        else {
            console.log(data)
            callback(id, data.AudioStream)
        }
    })
}

function uploadToS3(id, data, callback) {
    console.log("Uploading sound to S3...")
    const params = {
        Bucket: 'aseigneurin-ipponusa',
        Key: `text-to-speech/audio/${id}.mp3`,
        Body: data,
        ACL: "public-read"
    }
    const s3 = new AWS.S3()
    s3.upload(params, function (err, data) {
        if (err) throw(err)
        else {
            console.log(data)
            callback()
        }
    })
}

function updateRecordInDynamo(id, status, callback) {
    console.log("Updating item in DynamoDB...")
    const params = {
        TableName: "text-to-speech",
        Key: {
            "id": id
        },
        UpdateExpression: "SET #status = :status",
        ExpressionAttributeNames: {
            "#status": "status"
        },
        ExpressionAttributeValues: {
            ":status": status
        }
    }
    const documentClient = new AWS.DynamoDB.DocumentClient()
    documentClient.update(params, function (err, data) {
        if (err) throw(err)
        else callback()
    })
}
