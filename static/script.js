function shorten() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/", true);
    xhr.onload = function (e) {
        if (xhr.readyState === 4 && xhr.status === 200) {
            document.getElementById("result").innerHTML = xhr.responseText;
        }
    };
    xhr.onerror = function (e) {
        document.getElementById("result").innerHTML = "Try again?";
        console.error(xhr.statusText);
    };
    var url = document.getElementById("url").value;
    params = "link=" + url;
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.send(params);

    return false;
}
