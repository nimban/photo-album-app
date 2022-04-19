$(document).ready(function () {

    function callUploadApi(encoded_image, image_name, custom_tags = '') {
        // params, body, additionalParams
        console.log('Here ', image_name, custom_tags)
        var params = {
            "bucket": "photo-app-s3-for-images",
            "object": image_name,
            'ImageName': image_name,
            'Content-Type': 'application/octet-stream',
            'Content-Encoding': 'base64',
            'x-amz-meta-customLabels': "custom_tags",
            'x-amz-meta-name': image_name,
            'x-api-key': "aMj4OvKWoz1dJylEnvEf999MFEDo7YcSH3zWrnJa"
        }
        // if (custom_tags && custom_tags !== '') {
        //     params['x-amz-meta-customLabels'] = custom_tags
        // }

        url = 'https://pct4fmeeo6.execute-api.us-east-1.amazonaws.com/dev/upload/' + params.bucket + '/' + image_name
        return fetch(url, {
            // mode:"no-cors",
            method: 'PUT', // or 'PUT'
            headers: {
                'Content-Type': 'application/octet-stream',
                // 'Content-Encoding': 'base64',
                'x-amz-meta-customLabels': custom_tags,
                'x-api-key': 'aMj4OvKWoz1dJylEnvEf999MFEDo7YcSH3zWrnJa'
            },
            body: encoded_image
        })
            .then(response => {
                console.log(response)
            })
            .then(data => {
                console.log('Success:', data);
            })
            .catch((error) => {
                console.error('Error:', error);
            });

    }

    // return sdk.uploadBucketObjectPut(params, encoded_image, {});

    function b64toBlob(b64Data, contentType = '', sliceSize = 512) {
        b64Data = b64Data.split(',')[1]
        const byteCharacters = atob(b64Data);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);

            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        const blob = new Blob(byteArrays, {type: contentType});
        return blob;
    }

    function dataType64toFile(dataurl, filename = "NewFile") {
        //Convert base64 to file
        let arr = dataurl.split(","),
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]),
            n = bstr.length,
            u8arr = new Uint8Array(n)
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n)
        }
        // let newFile = new File([u8arr], filename, {
        //     type: mime,
        // })
        // return newFile
        return u8arr
    }

    function ArrayBufferToBinary(buffer) {
        // Convert an array buffer to a string bit-representation: 0 1 1 0 0 0...
        var dataView = new DataView(buffer);
        var response = "", offset = (8 / 8);
        for (var i = 0; i < dataView.byteLength; i += offset) {
            response += dataView.getInt8(i).toString(2);
        }
        return response;
    }

    $('.upload_button').click(function () {
        console.log("upload clicked")
        element = document.getElementById("file");
        tag = document.getElementById("custom-tag").value
        var file = element.files[0];
        var reader = new FileReader();
        reader.onloadend = function () {
            console.log(file.name);
            console.log("Tags: ", tag);
            console.log("Going to upload")
            //console.log('RESULT', reader.result);
            //call upload in sdk and pass reader.result
            // var data = reader.result
            // var data_new = (ArrayBufferToBinary(data))
            // var binaryBlob = data_new
            // data = data.split(',')[1]
            // var binaryBlob = atob(data)
            // var binaryblob = dataType64toFile(reader.result)
            // console.log(binaryblob)
            callUploadApi(b64toBlob(reader.result), file.name, $('.name-input').val())
        }
        reader.readAsDataURL(file);
    });

})
;