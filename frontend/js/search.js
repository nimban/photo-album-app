$(document).ready(function () {

    function executeSearchApi(message) {
        return sdk.searchGet({'q': message, "mode": 'no-cors'}, {}, {});
    }
    
    $('.search_button').click(function () {

        document.getElementById("image_grid").innerHTML = '';
        msg = $('.message-input').val();

        if ($.trim(msg) == '') {
            console.log("No input given");
            return false;
        }

        executeSearchApi(msg).then((response) => {
            listy = response.data.results;
            console.log(listy.length);
            var i;
            for (i = 0; i < listy.length; i++) {
                var elem = document.createElement("img");
                console.log(listy[i].url)
                elem.setAttribute("src", listy[i].url);
                elem.setAttribute("height", "100");
                elem.setAttribute("width", "100");
                document.getElementById("image_grid").appendChild(elem);
            }
        }).catch((error) => {
            console.log('Error during execution - ', error);
        });
    });

    $('.upload_button').click(function () {
        console.log("upload clicked")
    });
});