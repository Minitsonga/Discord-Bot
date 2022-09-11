const sidebar = document.querySelector(".sidebar");
const closeBtn = document.querySelector("#btn");
const searchBtn = document.querySelector(".bx-search");

const plugins_Drpdwn = document.querySelector("#plugins-dropbtn");
const plugins_dropdownList = document.querySelector("#plugins-dropdown-list");
const plugins_dropdownSymbol = document.querySelector("#plugins-dropdown-symbol");



plugins_Drpdwn.addEventListener("click", () => { // Sidebar open when you click on the search iocn


  if (plugins_dropdownSymbol.classList.contains("bx-chevron-down")) {
    plugins_dropdownSymbol.classList.replace("bx-chevron-down", 'bx-chevron-up');
  }
  else if (plugins_dropdownSymbol.classList.contains("bx-chevron-up")) {
    plugins_dropdownSymbol.classList.replace("bx-chevron-up", 'bx-chevron-down');
  }

  /*if (!plugins_Drpdwn.classList.contains("show")) {
      
  
      if (profile_Drpdwn.classList.contains("show")) {
        profile_dropdownList.classList.replace("fade-in", 'fade-out');
        setTimeout(function () {
          document.getElementById("profile-dropdown-list").style.display = "none";
          profile_Drpdwn.classList.remove("show");
          profile_dropdownSymbol.classList.replace("bx-chevron-up", 'bx-chevron-down');
        }, 300)
      }
    }*/


  if (sidebar.classList.contains("open") && plugins_Drpdwn.classList.contains("show")) {

    plugins_dropdownList.classList.replace("fade-in", 'fade-out');
    setTimeout(function () {
      document.getElementById("plugins-dropdown-list").style.display = "none";
      plugins_Drpdwn.classList.remove("show");

    }, 300)

  }
  else if (!sidebar.classList.contains("open")) {

    sidebar.classList.add("open");
    menuBtnChange();

    plugins_dropdownList.classList.replace("fade-out", 'fade-in');

    document.getElementById("plugins-dropdown-list").style.display = "block";
    plugins_Drpdwn.classList.add("show");



  }
  else if (sidebar.classList.contains("open") && !plugins_Drpdwn.classList.contains("show")) {

    plugins_dropdownList.classList.replace("fade-out", 'fade-in');

    document.getElementById("plugins-dropdown-list").style.display = "block";
    plugins_Drpdwn.classList.add("show");


  }

});




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

    //Dropdown handler fade out when close sidebar

    plugins_Drpdwn.classList.remove("show");
    plugins_dropdownList.classList.replace("fade-in", 'fade-out');
    setTimeout(function () {
      document.getElementById("plugins-dropdown-list").style.display = "none";
      if (plugins_dropdownSymbol.classList.contains("bx-chevron-up")) {
        plugins_dropdownSymbol.classList.replace("bx-chevron-up", 'bx-chevron-down');
      }
    }, 300);

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


