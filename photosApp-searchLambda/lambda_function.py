import json
import boto3
import requests
from botocore.config import Config
from requests_aws4auth import AWS4Auth


def get_s3_request_url(bucket, object_key, expiration=200000):
    s3_client = boto3.client('s3', config=Config(signature_version='s3v4'))
    response = s3_client.generate_presigned_url('get_object',
                                                Params={'Bucket': bucket, 'Key': object_key},
                                                ExpiresIn=expiration)
    return response


def lambda_handler(event, context):
    # Final Test 1
    keywords = []

    # Get keywords from Lex
    lex_client = boto3.client('lexv2-runtime')
    search_query = event["queryStringParameters"]["q"]

    response = lex_client.recognize_text(
        botId='AECWJ8MKPW',
        botAliasId='TSTALIASID',
        localeId='en_US',
        sessionId='test-session1',
        text=search_query
    )
    if 'sessionState' in response:
        if response["sessionState"]["intent"]["name"] == "SearchIntent":
            for key, value in response["sessionState"]["intent"]["slots"].items():
                if value is not None:
                    if len(value["value"]["resolvedValues"]) > 0:
                        keywords = keywords + value["value"]["resolvedValues"]

    # Search OpenSearch index for keywords
    keywords = keywords + [""]
    query = '(' + ','.join(keywords)[:-1] + ')'
    es_query = {
        "size": 20,
        "query": {
            "query_string": {
                "default_field": "labels",
                "query": query
            }
        }
    }
    credentials = boto3.Session().get_credentials()
    awsauth = AWS4Auth(credentials.access_key, credentials.secret_key, 'us-east-1', 'es',
                       session_token=credentials.token)
    url = 'https://search-photo-app-os-for-images-ammwpbfya53msencadbtkvkdb4.us-east-1.es.amazonaws.com/photo-album/_search'
    headers = {"Content-Type": "application/json"}
    es_result = requests.get(url, auth=awsauth, headers=headers, data=json.dumps(es_query)).json()
    es_result = es_result["hits"]["hits"]

    # Get s3 Object Urls corresponding to labels
    result_objects = []
    for entry in es_result:
        bucket = entry["_source"]["bucket"]
        object_key = entry["_source"]["objectKey"]
        labels = entry["_source"]["labels"]
        s3_url = get_s3_request_url(bucket, object_key)
        result_objects.append((s3_url, labels))
    s3_results = []
    for result in result_objects:
        s3_results.append({"url": result[0], "labels": result[1]})

    return {
        'statusCode': 200,
        "headers": {
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "OPTIONS,POST",
        },
        'body': json.dumps({"results": s3_results})
    }
