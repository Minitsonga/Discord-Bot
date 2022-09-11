const desabledPlugin = document.querySelector("#desabledPlugin");
const desabledPluginPopUpHolder = document.querySelector("#holderPluginDesactivation");
const cancelDesactivateyPopUp = document.querySelector('#cancelDesactivateBtn')
const overlay = document.getElementById('overlay')

const infobutton = document.querySelector("#infoButtonTextArea");
const textAeraInfoPopUpHolder = document.querySelector("#helpTextArea");
const validatetextAeraInfoPopUp = document.querySelector('#validInfo')

setTimeout( () => {
    if (!document.getElementById("switch").checked) {
        document.getElementById("save").style.display = "none";
    }
    else {
        document.getElementById("save").removeAttribute("style");
    }
}, 10)


overlay.addEventListener('click', () => {

    closePopUp(desabledPluginPopUpHolder)
    closePopUp(textAeraInfoPopUpHolder)
    document.getElementById("switch").checked = true;
    document.getElementById("save").removeAttribute("style");

})


cancelDesactivateyPopUp.addEventListener('click', () => {
    closePopUp(desabledPluginPopUpHolder)
    document.getElementById("switch").checked = true;
    document.getElementById("save").removeAttribute("style");
})

infobutton.addEventListener('click', () => {
    openPopUp(textAeraInfoPopUpHolder)
  
})

validatetextAeraInfoPopUp.addEventListener('click', () => {
    closePopUp(textAeraInfoPopUpHolder)
})

function openPopUp(popUp) {
    if (popUp == null) return
    popUp.classList.add('active')
    overlay.classList.add('active')
}

function closePopUp(popUp) {
    if (popUp == null) return
    popUp.classList.remove('active')
    overlay.classList.remove('active')
}

