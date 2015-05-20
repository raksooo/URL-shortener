function shorten() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "/", true);
    xhr.onload = function (e) {
        if (xhr.readyState === 4 && xhr.status === 200 && xhr.responseText !== "") {
            var result = document.getElementById("result");
            var a = document.createElement("a");
            a.setAttribute("href", xhr.response);
            a.innerHTML = xhr.response;
            result.innerHTML = "";
            result.className = "result";
            result.appendChild(a);
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
