function isLogin(user) {
    if (!user) {
        //HEADER
        document.getElementById('login').setAttribute("onclick", "location.href='/auth/discord'");
        document.getElementById('text').innerHTML = "Connection";

        //BODY
        document.getElementById('login2').setAttribute("onclick", "location.href='/auth/discord'");
        document.getElementById('text2').innerHTML = "Se connecter";

        console.log("ici : " + location.href);

    }
    else{
        return;
    }
}