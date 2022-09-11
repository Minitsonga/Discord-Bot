const sidebar = document.querySelector(".sidebar");
const closeBtn = document.querySelector("#btn");
const searchBtn = document.querySelector(".bx-search");

closeBtn.addEventListener("click", () => {
  sidebar.classList.toggle("open");
  menuBtnChange();//calling the function(optional)


  //Hide the grid
  if (sidebar.classList.contains("open") && window.innerWidth < 520) {
    setTimeout(function () {
      document.getElementById("home-section").style.display = "none";
    }, 200)

  }

  //Rize the grid to 2 row
  if (sidebar.classList.contains("open") && window.innerWidth <= 1050 && window.innerWidth > 930) {

    setTimeout(function () {
      document.getElementById("home-section").setAttribute("style", 'grid-template-columns: repeat(8,1fr);');

    }, 125);

  }

  //Rize the grid to 1 row
  if (sidebar.classList.contains("open") && window.innerWidth <= 800 && window.innerWidth >= 680) {
    setTimeout(function () {
      document.getElementById("home-section").setAttribute("style", 'grid-template-columns: repeat(6, 1fr);');

    }, 125);

  }

  if (sidebar.classList.contains("open")) {
    console.log("opened", window.innerWidth);
  }


  if (!sidebar.classList.contains("open")) {
    console.log("closed");
    setTimeout(function () {
      document.getElementById("home-section").removeAttribute("style");
    }, 100);


  }

});


searchBtn.addEventListener("click", () => { // Sidebar open when you click on the search iocn
  sidebar.classList.toggle("open");
  menuBtnChange(); //calling the function(optional)
});

// following are the code to change sidebar button(optional)
function menuBtnChange() {
  if (sidebar.classList.contains("open")) {
    closeBtn.classList.replace("bx-menu", "bx-menu-alt-right");//replacing the iocns class
  } else {
    closeBtn.classList.replace("bx-menu-alt-right", "bx-menu");//replacing the iocns class
  }
}




