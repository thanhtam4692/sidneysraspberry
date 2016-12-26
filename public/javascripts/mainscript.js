$(document).ready(function() {

console.log(fnWindowHeight() + " " + fnWindowWidth());
  currentWidth = fnWindowWidth();
  if ($("html").hasClass("ios")){
    $("body").css({
      "min-height": fnWindowHeight()
    });
  }
  $(".lazy").unveil();
  isGettingNewContent = true;
  $(document).ajaxStop(function() {
    if (isGettingNewContent) {
      unveil()
    }
    textTruncating();
  })

  isBannerHoverTransparent = true;
  switchBanners();

  pagesArray = new Array();
  arrayOfPagesContent = new Array()
  arrayOfAnimation = [
    toggleDisplayMosaicDissolve,
    toggleDisplayDissolve
  ];

  // Selective menu for either desktop or mobile
  isMenuCollapsed = true;
  $("body").on("click", "#menu-expanding", function(){
    collapsingMenu("menu");
  });
  dm = $("#desktop-menu").detach();
  mm = $("#mobile-menu").detach();
  changeDevicePreferences();
  timeout = false;
  delta = 500;
  $(window).resize(function() {
    if ($("html").hasClass("ios")){
      $("body").css({
        "min-height": fnWindowHeight()
      });
    }
    if (currentWidth !== fnWindowWidth()) {
      rtime = new Date();
      if (timeout === false) {
          timeout = true;
          setTimeout(resizeend, delta);
      }
    }
  });
  //Get the hashtag from url and perform the animation as if it was clicked on
  if (window.location.hash != ""){
    getPages(window.location.hash.split('#')[1]);
  } else {
    $("#mobile-menu .ch-grid .ch-item-li").slideUp("fast");
  }

  //Click on a menu item
  $("body").on("click", ".ch-item", function(){
    // window.location.hash = this.id;
    if(history.pushState) {
      history.pushState(null, null, "#" + this.id);
    }
    else {
      window.location.hash = this.id;
    }
    getPages(this.id);
  });

  // Use delegate event for new added class (after Ajax)
  $("body").on("click", ".thumbnail-image", function(){
    currentZoommingImage = this.id;
    // currentZoommingImageWidthCss = $("#" + this.id).css("width");
    zoomImageFullScreen(this.id);
  });

  $("body").on("click", "#fullscreen-blur", function(){
    dismissFullscreenImage();
  });

  $("body").on("click", "#button-cv", function(){
  });

  $("body").on("click", ".portfolio-entry", function(){
    getPortfolio(this.id);
  });

  $("body").on("click", ".button-close", function(){
    closePopup();
  });

  $("body").on("mouseover touchstart", "#portfolio-1-lower-subtitle", function(){
    textNormalise("#portfolio-1-lower-subtitle");
    $("#portfolio-alert-message").hide();
  });
  $("body").on("mouseleave", "#portfolio-1-lower-subtitle", function(){
    textEffectResizingDown("#portfolio-1-lower-subtitle");
    $("#portfolio-alert-message").show();
  });

  textTruncating()
});

function changeDevicePreferences(){
  if (fnWindowWidth() <= 1024) {
    $("html").removeClass("desktop")
    $("html").addClass("mobile");
  } else {
    $("html").removeClass("mobile")
    $("html").addClass("desktop");
  }
  if ($("html").hasClass("desktop")){
    if ($("#mobile-menu").length > 0){
      mm = $("#mobile-menu").detach();
    }
    $(".navigator-top").html(dm);
  } else {
    if ($("#desktop-menu").length > 0){
      dm = $("#desktop-menu").detach();
    }
    $(".navigator-top").html(mm);
    if (!isMenuCollapsed){
      collapsingMenu("menu");
    }
  }
  getBanner("#banner1");
  resetPagesComeBeforeTheSelected();
}

function resizeend() {
    if (new Date() - rtime < delta) {
        setTimeout(resizeend, delta);
    } else {
        timeout = false;
        changeDevicePreferences();
        currentWidth = fnWindowWidth();
    }
}

function unveil(){
  $(".lazy").unveil(0,function(){
    loadingWarning($(this))
    $(this).load(function(){
      this.style.opacity = 1;
      loadingWarning($(this))
      $(this).removeClass("lazy")
    })
  })
}

function doOnOrientationChange()
{
  // location.reload();
  switch(window.orientation)
  {
    case -90:
      break;
    case 90:
      break;
    default:
      break;
  }
}

window.addEventListener('orientationchange', doOnOrientationChange);

// Get image size before it fully load. Then use that result on a callback
function getImageSize(img, callback) {
    var $img = $(img);

    var wait = setInterval(function() {
        var w = $img[0].naturalWidth,
            h = $img[0].naturalHeight;
        if (w && h) {
            clearInterval(wait);
            callback.apply(this, [w, h]);
        }
    }, 30);
}
function textTruncating(){
  for (var i = 0; i < $(".truncated").length; i++) {
    var theTxt = $($(".truncated")[i]).html();
    var length = 330;
    var ending = '...';
    if (theTxt.length > length) {
      $($(".truncated")[i]).html(theTxt.substring(0, length - ending.length) + ending);
    }
  }
}
function textNormalise(textId){
  $(textId + " span").css("font-size", "20px");
}
function textEffectResizingDown(textId){
  var theText = $(textId).text();
  $(textId).html("");
  for (var i = 0; i < theText.length; i++) {
    $(textId).append("<span style=\"font-size: " + (20 - (20-2)/theText.length * i) + "px;\">" + theText.charAt(i) + "</span>");
  }
}
function closePopup(){
  $("#content-container-portfolio, .navigator-top, .banner-holder").show();
  $(".popupContent").remove();
}
function getPortfolio(portfolioId){
  addFullscreenPopup(portfolioId);
  $(".popupContent").animate({
    "opacity": 1,
    "top": 0,
    "left": 0,
    "min-height": "100vh",
    "width": "100vw"
  }, 500, function(){
    $("#content-container-portfolio, .navigator-top, .banner-holder").hide();
    $(".popupContent").css("position", "relative")
    addCloseButton(".popupContent")
    $.ajax({
      method: "POST",
      url: "/portfolio/entries",
      data: {"entryId": portfolioId}
    })
    .done(function(msg) {
      $(".popupContent").html(msg);
      $("#portfolio-main-container").animate({
        opacity: 1
      }, 500, function(){

      });
      addCloseButton(".popupContent");
      if (portfolioId === "portfolio-entry-1") {
        textEffectResizingDown("#portfolio-1-lower-subtitle");
      }
    })
    .fail(function() {
      // alert( "error" );
    });
  });
}
function addCloseButton(divId){
  $(divId).append("<div class=\"button-close-wrapper\"><div class=\"button-close\" id=\"button-close-portfolio-entry\"></div></div>")
}
function addFullscreenPopup(portfolioId){
  $("#innerBody").append("<div id=\"popupContent-" + portfolioId + "\" class=\"popupContent\"><div id=\"portfolio-main-container\"></div></div>")
  $(".popupContent").css({
    "position": "absolute",
    "display": "block",
    "top": fnWindowHeight(),
    "left": 0,
    "width": "100vw",
  });
  loadingWarning($("#portfolio-main-container"))
  $(".popupContent ~ .loadingCon").css({
    "z-index": 5
  })
}

function zoomImageFullScreen(selectedImage){
  if (selectedImage === "cv-image"){
    var biggerImageUrl = "https://s3-us-west-2.amazonaws.com/sidneysservices/personaldocuments/TamTran-CV.jpg";
  }
  if($("#fullscreen-blur").length === 0){
    $("#innerBody").append("<div id=\"fullscreen-blur\"></div>");
    var img = $("#" + selectedImage).clone().attr({
      "id": "enlargened-image"
      // "data-src": $("#" + selectedImage).attr("src"),
      // "src": ""
    });
    img.removeClass()
    $("#fullscreen-blur").html(img);
    var selectedImageRatio = $("#" + selectedImage)[0].naturalWidth / $("#" + selectedImage)[0].naturalHeight;
    if (selectedImageRatio > (fnWindowWidth()/ fnWindowHeight())){
      // Go full width
      var selectedImageWidth = fnWindowWidth();
      var selectedImageHeight = selectedImageWidth / selectedImageRatio;
      var selectedImageStartingPositionVertical = (fnWindowHeight() - selectedImageHeight) / 2;
      var selectedImageStartingPositionHorizontal = 0
    } else {
      // Go full height
      var selectedImageHeight = fnWindowHeight();
      var selectedImageWidth = selectedImageHeight * selectedImageRatio;
      var selectedImageStartingPositionVertical = 0;
      var selectedImageStartingPositionHorizontal = (fnWindowWidth() - selectedImageWidth) / 2;
    }
    var selectedImageCurrentTop = $("#" + selectedImage).offset().top;
    var selectedImageCurrentLeft = $("#" + selectedImage).offset().left;
    var selectedImageCurrentHeight = $("#" + selectedImage).height();
    var selectedImageCurrentWidth = $("#" + selectedImage).width();

    $("#enlargened-image").css({
      "position": "fixed",
      "height": selectedImageCurrentHeight,
      "width": selectedImageCurrentWidth,
      "top": selectedImageCurrentTop,
      "left": selectedImageCurrentLeft,
      "z-index": "6"
    });

    $("#enlargened-image").animate({
      "height": selectedImageHeight,
      "width": selectedImageWidth,
      "top": selectedImageStartingPositionVertical,
      "left": selectedImageStartingPositionHorizontal
    }, 300, function(){
      if (biggerImageUrl != undefined && biggerImageUrl != "" && biggerImage != $("#" + selectedImage).attr("src")){
        var biggerImage = new Image();
        biggerImage.src = biggerImageUrl;
        $("#enlargened-image").attr("src", biggerImageUrl);
      }
    });
  } else {
    // Haven't worked yet
    manualZoomming("#cv-image");
  }
}

function manualZoomming(selectedImage){
  // Later
}

function dismissFullscreenImage(){
  $("#fullscreen-blur").animate({
    "opacity": "0"
  }, 300, function(){
    $("#fullscreen-blur").remove();
  });
  // $("#" + currentZoommingImage).css({
  //   "position": "relative",
  //   "top": "auto",
  //   "left": "auto",
  //   "height": "auto",
  //   "width": currentZoommingImageWidthCss,
  //   "z-index": "1"
  // });
}

function getPages(pageId){
  isGettingNewContent = true;
  for (var i = 0; i < $("img").length; i++) {
    getImageSize($("img")[i], function(iwidth, iheight){
      $($("img")[i]).height(iheight);
      $($("img")[i]).width(iwidth);
    });
  }
  clearInterval(bannerSwitchingInterval);
  $("#content-container-" + pageId + " .errMes").remove();
  pageTransform(pageId);
  $.ajax({
    method: "POST",
    url: "/" + pageId,
    data: {}
  })
  .done(function(pageContent) {
    if (pageContent !== arrayOfPagesContent[pageId]) {
      arrayOfPagesContent[pageId] = pageContent
      $("#content-container-" + pageId).html(pageContent)
    } else {
      isGettingNewContent = false;
    }
  })
  .fail(function() {
    var errorContent = "<span class=\"txtSmall mtxtSmall main-title errMes\">Sooooo sorry, something went wrong. Please try again! (You may need to check your connection)</span>";
    arrayOfPagesContent[pageId] = errorContent;
    $("#content-container-" + pageId).html(errorContent);
  });
}

function pageTransform(currentPageId){
  // Check if the page is existed. If not, add the page with its content. Otherwise, refresh the content.
  if (!checkExistedPage(currentPageId)){
    $("#innerBody").append("<div class=\"content-container\" id=\"content-container-" + currentPageId + "\"></div>")
    pagesArray.push(currentPageId);
    $("#content-container-" + currentPageId).css({
      "width": "100vw",
      "top": fnWindowHeight(),
      // "min-height" : fnWindowHeight() - $(".navigator-top").height() - $(".footer").height()
    });

  }
  // else {
  //   // $("#content-container-" + currentPageId).css({
  //   //   "min-height" : fnWindowHeight() - $(".navigator-top").height()
  //   // });
  // }
  // $("#content-container-" + currentPageId).html(pageContent);
  settleDownIndexPage(currentPageId);
}

function settleDownIndexPage(clkedBtn){
  // When a menu entry is clicked, the menu is un-collapsed
  // This function also runs when the page with hashtag loaded, that means in that case, the menu should be un-collapsed, so we can run the collapsingMenu function, to collapse and highlight the button
  isMenuCollapsed = false;
  mm.find(".ch-item").css("background-color", "rgba(0,0,0,0)");
  dm.find(".ch-item").css("background-color", "rgba(0,0,0,0)");

  mm.find(".ch-" + clkedBtn).css("background-color", "rgba(112,188,217, 0.5)");
  dm.find(".ch-" + clkedBtn).css("background-color", "rgba(112,188,217, 0.5)");

  mm.find(".ch-item-li").removeClass("clicked");
  mm.find("#ch-item-li-" + clkedBtn).addClass("clicked");
  collapsingMenu(clkedBtn);
}

function collapsingMenu(currentSelectedPageId){
  // Check is mobile menu exists. If not, re-positioning the pages
  if ($("#mobile-menu").length > 0) {
    // Check if the menu is collapsed.
    if (isMenuCollapsed) {
      // The menu is collapsed, now un-collapse it
      $("#mobile-menu .ch-grid .ch-item-li").slideDown();
      isMenuCollapsed = false; // Now the menu is un-collapsed, set isMenuCollapsed to false
    } else {
      // Go through all of the .ch-item-li array A - the menu entries
      // How it works: If the A[i] is NOT the clicked, slide it UP (hide it)
      //  If the A[i] is the second to last, check if the last (the i+1) is the clicked. If it is, A[i] is the last one to be slided UP, then add the callback and fire the repositioning. If it is not, then move on.
      //  After checking if A[i] is the second to last, check if the A[i] is the last entry. Since the previous checkup has proven that the last one is NOT clicked, add the callback to the last entry after slide it up
      // Check if currentSelectedPageId is equal to menu. If it is, meaning that the trigger is the menu indicator itself. If it is not, the trigger was user clicked on a menu entry, hence execute as expected.
      for (var i = 0; i < ($(".ch-item-li").length); i++) {
        // If this is the previous to the last menu entry, check if the next is the clicked
        if (i === ($(".ch-item-li").length-2)) {
          // Check if the next (i+1) is the clicked
          if ($("#" + $(".ch-item-li")[i+1].id).hasClass("clicked")) {
            $("#" + $(".ch-item-li")[i].id).slideUp("fast", function(){
              // If the clicked entry is not the menu indicator
              if (currentSelectedPageId != "menu"){
                resetPagesPosition(currentSelectedPageId);
              }
            });
            $("#" + $(".ch-item-li")[i+1].id).slideDown("fast");
            i++;
          } else {
            // Check if the current A[i] is  the clicked
            if (!$("#" + $(".ch-item-li")[i].id).hasClass("clicked")) {
                $("#" + $(".ch-item-li")[i].id).slideUp("fast");
            } else {
              $("#" + $(".ch-item-li")[i].id).slideDown("fast");
            }
          }
        } else {
          // Check if the current A[i] is the last menu entry
          if (i === ($(".ch-item-li").length-1)) {
            // Since it passed the previous IF, the last menu entry is not clicked. Slide it up following with the callback.
            $("#" + $(".ch-item-li")[i].id).slideUp("fast", function(){
              // If the clicked entry is not the menu indicator
              if (currentSelectedPageId != "menu"){
                resetPagesPosition(currentSelectedPageId);
              }
            });
          }

          // Check if the current A[i] is not the clicked
          if (!$("#" + $(".ch-item-li")[i].id).hasClass("clicked")) {
              $("#" + $(".ch-item-li")[i].id).slideUp("fast");
          } else {
            $("#" + $(".ch-item-li")[i].id).slideDown("fast");
          }

        }
      }
      isMenuCollapsed = true;
    }
  } else { // On desktop
    resetPagesPosition(currentSelectedPageId);
  }
}

function resetPagesPosition(currentSelectedPageId){
  var isPassed = false;
  for (var i = 0; i < pagesArray.length; i++) {
    if (!isPassed) {
      // Scroll pages that come before the selected
      resetPagesComeBeforeTheSelected(pagesArray[i], currentSelectedPageId)
    } else {
      // Scroll and slide down pages that come after the selected
      $("#content-container-" + pagesArray[i]).css({
        "position": "absolute",
        "top": $(".navigator-top").height()
      })
      $("#content-container-" + pagesArray[i]).animate({
        "top": fnWindowHeight()
      }, 500, function(){
        $(this).hide();
      });
    }
    if (pagesArray[i] === currentSelectedPageId) {
      isPassed = true;
    }
  }
}

function resetPagesComeBeforeTheSelected(pagei, currentSelectedPageId){
  // Check if the pagei is NOT the current page that are selecting.
  if (pagei != currentSelectedPageId) {
    $("#content-container-" + pagei).css({
      "position": "absolute",
      "top": $(".navigator-top").height()
    })
    $("#content-container-" + pagei).animate({
      // "top": $(".navigator-top").height(),
      "top": fnWindowHeight()/2,
      // "top": 0,
      // "min-height": 0,
    }, 500, function(){
      $("#content-container-" + pagei).hide(10);
    });
  } else {
    $("#content-container-" + pagei).css({
      "position": "relative"
    });
    $("#content-container-" + pagei).show();
    $("#content-container-" + pagei).animate({
      "top": 0
      // "min-height" : fnWindowHeight() - $(".navigator-top").height()
    }, 500, function(){
    });
  }
}

// function readjustFooter(currentPage, loaded){
  // if (loaded === "loaded"){
  //   $("body").css("height", $("#content-container-" + currentPage).outerHeight() + $("#content-container-" + currentPage).offset().top);
  //   $("body").css({
  //     "height": $("#content-container-" + currentPage).outerHeight() + $(".navigator-top").height()
  //   });
  // } else {
  //   $("body").css("height", $("#content-container-" + currentPage).outerHeight() + $("#content-container-" + currentPage).offset().top);
  //   $("body").animate({
  //     "height": $("#content-container-" + currentPage).outerHeight() + $(".navigator-top").height()
  //   }, 500);
  // }
// }

function checkExistedPage(givenPage){
  for (var i = 0; i < pagesArray.length; i++) {
    if (pagesArray[i] === givenPage) {
      return true;
    }
  }
  return false;
}

function checkExistedPageAndDelete(givenPage){
  for (var i = 0; i < pagesArray.length; i++) {
    if (pagesArray[i] === givenPage) {
      pagesArray.splice(i, 1);
    }
  }
  return false;
}
function box_width() {
  return fnWindowWidth() / horizontal_pieces;
}
function box_height() {
  return fnWindowHeight() / vertical_pieces;
}
function fnWindowHeight(){
  // console.log((window.innerHeight > 0) ? window.innerHeight : screen.height);
  return (window.innerHeight > 0) ? window.innerHeight : screen.height;
}
function fnWindowWidth(){
  // console.log((window.innerWidth > 0) ? window.innerWidth : screen.width);
   return (window.innerWidth > 0) ? window.innerWidth : screen.width;
}

function switchBanners(){
  bannerHovers = new Array();
  currentHoverCount = 0;

  var el = $('#banner1');
  el.width(fnWindowWidth()).height(fnWindowHeight());

  horizontal_pieces = 5;
  vertical_pieces = 5;
  total_pieces = horizontal_pieces * vertical_pieces;


  for (i = 0; i < total_pieces; i++)
  {
    var tempEl = $('<span class="hover" id="hover-' + i + '"></span>');

    el.append(tempEl);
    bannerHovers.push(tempEl);
  }
  $('#banner1 .hover').width(box_width()).height(box_height());

  getBanner("#banner1");

  var marked = 0;
  bannerSwitchingInterval = setInterval(function(){
    if (bannerHovers[0].css('opacity') === "0") {
      getBanner("#banner1 span.hover");
    } else {
      getBanner("#banner1");
    }

  }, 5000);
}

function spinning(){
  $("#spinning-container").append("<div class=\"spinner\"><div class=\"double-bounce1\"></div><div class=\"double-bounce2\"></div></div>");
  addSpinningInterval = setInterval(function(){
    $("#spinning-container").append("<div class=\"spinner\"><div class=\"double-bounce1\"></div><div class=\"double-bounce2\"></div></div>");

    if ($(".spinner").length > 10) {
      clearInterval(addSpinningInterval);
      $("#spinning-container").html("");
    }
  }, 1000);
};

function removeSpinning(){
  if (typeof addSpinningInterval !== 'undefined'){
    clearInterval(addSpinningInterval);
  }
  $("#spinning-container").html("");
};

function getBanner(bannerId){
  // Refresh banner size and banner hovers size when window resized
  $("#banner1").width(fnWindowWidth()).height(fnWindowHeight());
  $("#banner1 .hover").width(box_width()).height(box_height());

  // loadingWarning(bannerId);
  $.ajax({
    method: "POST",
    url: "/banners",
    data: {}
  })
  .done(function(msg) {
    if (msg.error === "0") {
      pic = new Image();
      pic.src = msg.url;
      // Get image size before it's fully loaded. Then use that sizes to the callback
      getImageSize(pic, function(iwidth, iheight){
        setBannerHoversPosition(iheight, iwidth, bannerId);
      });
      $(bannerId).css("background-image", "url(\"" + pic.src + "\")");
      var randomNumber = Math.floor((Math.random() * arrayOfAnimation.length) + 1);
      arrayOfAnimation[randomNumber % arrayOfAnimation.length]();
      removeSpinning()
      spinning()
    }
  })
  .fail(function() {
    // alert( "error" );
  });
};

function loadingWarning(elID){
  if (elID.siblings(".loadingCon").length > 0){
    elID.siblings(".loadingCon").remove();
  } else {
    elID.parent().append("<div class=\"loadingCon\"><div class=\"cssload-loader\"><div class=\"cssload-dot\"></div><div class=\"cssload-dot\"></div><div class=\"cssload-dot\"></div><div class=\"cssload-dot\"></div><div class=\"cssload-dot\"></div><div class=\"cssload-dot\"></div><div class=\"cssload-dot\"></div><div class=\"cssload-dot\"></div></div></div>");
    // elID.children(".loadingCon").css({
    //   height: elID.height(),
    //   width: elID.width(),
    // })
  }

}

function setBannerHoversPosition(picHeight, picWidth, bannerId){
  var imageRatio = picWidth / picHeight;
  var windowRatio = fnWindowWidth() / fnWindowHeight();
  var beginningVertiPos = 0;
  var beginningHoriPos = 0;
  if (imageRatio > windowRatio){
    // Go full height
    var zoomProperty = fnWindowHeight() / picHeight;
    $(bannerId).css("background-size", zoomProperty * picWidth + "px " + fnWindowHeight() + "px");

    beginningVertiPos = 0;
    beginningHoriPos = (picWidth * fnWindowHeight() / picHeight - box_width() * horizontal_pieces)/2;
  } else {
    // Go full width
    var zoomProperty = fnWindowWidth() / picWidth;
    $(bannerId).css("background-size", fnWindowWidth() + "px " + zoomProperty * picHeight + "px");

    beginningHoriPos = 0;
    beginningVertiPos = (picHeight * fnWindowWidth() / picWidth - box_height() * vertical_pieces)/2;
  }


  if (bannerId != "#banner1") {
    for (i=0; i<total_pieces; i++)
    {
      var horizontal_position = beginningHoriPos + (i % horizontal_pieces) * box_width();

      if(i > 0 && i % horizontal_pieces === 0)
      {
        beginningVertiPos += box_height();
      }

      bannerHovers[i].css('background-position', '-' + horizontal_position + 'px -' + beginningVertiPos + 'px');
    }
  } else {
    $(bannerId).css('background-position', '-' + beginningHoriPos + 'px -' + beginningVertiPos + 'px');
  }
}

function toggleDisplayMosaicDissolve()
{
  var tempEl = bannerHovers[currentHoverCount];

  if (currentHoverCount === 0) {
    var opacity = tempEl.css("opacity");
    if(opacity === "0")
    {
      isBannerHoverTransparent = true;
    }
    else
    {
      isBannerHoverTransparent = false;
    }
  }

  if(isBannerHoverTransparent)
  {
    tempEl.css({
      "box-shadow": "10px 10px 10px rgba(0,0,0,0.5)"
    })
    tempEl.animate({ "opacity": "1" })
  }
  else
  {
    tempEl.css({
      "box-shadow": ""
    })
    tempEl.animate({ "opacity": "0" })
  }

  if ((currentHoverCount + 1) < total_pieces) {
    currentHoverCount = (currentHoverCount + 1) % total_pieces;
    setTimeout(toggleDisplayMosaicDissolve, 50);
  } else {
    currentHoverCount = 0;
  }

}

function toggleDisplayMosaicFlip()
{
  var tempEl = bannerHovers[currentHoverCount];

  if (currentHoverCount === 0) {
    var opacity = tempEl.css('opacity');
    if(opacity === "0")
    {
      isBannerHoverTransparent = true;
    }
    else
    {
      isBannerHoverTransparent = false;
    }
  }

  if(isBannerHoverTransparent)
  {
    tempEl.css({
      "box-shadow": "10px 10px 10px rgba(0,0,0,1)"
    })
    tempEl.animate({ opacity: 1 }, 150);
    tempEl.animateRotate(360, 300, "linear", function(){
          // console.log(this); //this is supposed to be the DOM node, but it isn't
      });
    // tempEl.animate({ opacity: 1 });
  }
  else
  {
    tempEl.css({
      "box-shadow": ""
    })
    tempEl.animate({ opacity: 0 }, 150);
    tempEl.animateRotate(360, 300, "linear", function(){
          // console.log(this); //this is supposed to be the DOM node, but it isn't
      });
  }

  if ((currentHoverCount + 1) < total_pieces) {
    currentHoverCount = (currentHoverCount + 1) % total_pieces;
    setTimeout(toggleDisplayMosaicFlip, 100);
  } else {
    currentHoverCount = 0;
  }

}

function toggleDisplayFlip()
{
  var tempEl = bannerHovers[currentHoverCount];

  if (currentHoverCount === 0) {
    var opacity = tempEl.css('opacity');
    if(opacity === "0")
    {
      isBannerHoverTransparent = true;
    }
    else
    {
      isBannerHoverTransparent = false;
    }
  }

  if(isBannerHoverTransparent)
  {
    $('#banner1 .hover').animate({ opacity: 1 }, 250);
    $('#banner1 .hover').animateRotate(360, 500, "linear", function(){
          // console.log(this); //this is supposed to be the DOM node, but it isn't
      });
    // tempEl.animate({ opacity: 1 });
  }
  else
  {
    $('#banner1 .hover').animate({ opacity: 0 }, 250);
    $('#banner1 .hover').animateRotate(360, 500, "linear", function(){
          // console.log(this); //this is supposed to be the DOM node, but it isn't
      });
  }

  currentHoverCount = 0;

}

function toggleDisplayDissolve()
{
  var tempEl = bannerHovers[currentHoverCount];

  if (currentHoverCount === 0) {
    var opacity = tempEl.css("opacity");
    if(opacity === "0")
    {
      isBannerHoverTransparent = true;
    }
    else
    {
      isBannerHoverTransparent = false;
    }
  }

  if(isBannerHoverTransparent)
  {
    $('#banner1 .hover').animate({ opacity: 1 })
  }
  else
  {
    $('#banner1 .hover').animate({ opacity: 0 })
  }

  currentHoverCount = 0;

}

$.fn.animateRotate = function(angle, duration, easing, complete) {
    var args = $.speed(duration, easing, complete);
    var step = args.step;
    return this.each(function(i, e) {
        args.step = function(now) {
            $.style(e, 'transform', 'rotateX(' + now + 'deg)');
            if (step) return step.apply(this, arguments);
        };

        $({deg: 0}).animate({deg: angle}, args);
    });
};
