import json
import boto3
from requests_aws4auth import AWS4Auth
from elasticsearch import Elasticsearch, RequestsHttpConnection


def lambda_handler(event, context):

    # Test comment: final test

    bucket = event["Records"][0]["s3"]["bucket"]["name"]
    objectKey = event["Records"][0]["s3"]["object"]["key"]

    # Get Labels from Rekognition
    client = boto3.client('rekognition')
    response = client.detect_labels(
        Image={
            'S3Object': {
                'Bucket': bucket,
                'Name': objectKey
            }
        },
        MaxLabels=5
    )
    rekognition_labels = []
    for label in response["Labels"]:
        rekognition_labels.append(label["Name"])

    # Get S3 metadata
    head_object = boto3.client("s3").head_object(Bucket=bucket, Key=objectKey)
    timestamp = head_object["LastModified"].strftime("%Y-%m-%dT%H:%M:%S")
    custom_labels = head_object['Metadata']['customlabels']
    rekognition_labels.append(custom_labels)
    labels = rekognition_labels

    # Store Elastic Search Index Object
    es_object = {
        "objectKey": objectKey,
        "bucket": bucket,
        "createdTimestamp": timestamp,
        "labels": labels
    }
    print(es_object)
    credentials = boto3.Session().get_credentials()
    awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, 'us-east-1', 'es',
                       session_token=credentials.token)
    es = Elasticsearch(
        hosts=[{'host': "search-photo-app-os-for-images-ammwpbfya53msencadbtkvkdb4.us-east-1.es.amazonaws.com", 'port': 443}],
        http_auth=awsauth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection
    )
    es_response = es.index(index="photo-album", id=es_object["objectKey"], body=es_object)
    print(es_response)
    return {
        'statusCode': 200,
        'body': json.dumps("Completed")
    }
