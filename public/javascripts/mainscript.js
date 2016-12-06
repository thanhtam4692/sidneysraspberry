function windowHeight(){
  return $(window).height();
}
function windowWidth(){
   return $(window).width();
}
$(document).ready(function() {

  height = $(window).height();
  width = $(window).width();

  isBannerHoverTransparent = true;

  switchBanners();

  pagesArray = new Array();

  //Get the hashtag from url and perform the animation as if it was clicked on
  if (window.location.hash != ""){
    getPages(window.location.hash.split('#')[1]);
  }

  //Click on a menu item
  $(".ch-item").click(function(){
    window.location.hash = this.id;
    getPages(this.id);
  });

  // Use delegate event for new added class (after Ajax)
  $("body").on("click", ".thumbnail-image", function(){
    currentZoommingImage = this.id;
    currentZoommingImageWidthCss = $("#" + this.id).css("width");
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

  $("body").on("click", "#button-close-portfolio-entry", function(){
    closePopup();
  });

  $("body").on("mouseover", "#portfolio-1-lower-subtitle", function(){
    textNormalise("#portfolio-1-lower-subtitle");
    $("#portfolio-alert-message").hide();
  });
  $("body").on("mouseleave", "#portfolio-1-lower-subtitle", function(){
    textEffectResizingDown("#portfolio-1-lower-subtitle");
    $("#portfolio-alert-message").show();
  });

});

function doOnOrientationChange()
{
  location.reload();
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

function getImageSize(img, callback){
    img = $(img);

    var wait = setInterval(function(){
        var w = img.width(),
            h = img.height();

        if(w && h){
            done(w, h);
        }
    }, 0);

    var onLoad;
    img.on('load', onLoad = function(){
        done(img.width(), img.height());
    });


    var isDone = false;
    function done(){
        if(isDone){
            return;
        }
        isDone = true;

        clearInterval(wait);
        img.off('load', onLoad);

        callback.apply(this, arguments);
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
  $(".popupContent").remove();
}
function getPortfolio(portfolioId){
  popupFullScreenContent(portfolioId);
  $.ajax({
    method: "POST",
    url: "/portfolio/entries",
    data: {"entryId": portfolioId}
  })
  .done(function(msg) {
    $(".popupContent").append(msg);
    if (portfolioId == "portfolio-entry-1") {
      textEffectResizingDown("#portfolio-1-lower-subtitle");
    }
    if ($(".popupContent img").length > 0){
      $(".popupContent img").load(function(){
        $(".popupContent").animate({
          "opacity": 1,
          "top": 0,
          "left": 0,
          "min-height": height,
          "width": width
        }, 500);
      });
    } else {
      $(".popupContent").animate({
        "opacity": 1,
        "top": 0,
        "left": 0,
        "min-height": height,
        "width": width
      }, 500);
    }
  })
  .fail(function() {
    // alert( "error" );
  });
}

function popupFullScreenContent(portfolioId){
  $("#innerBody").append("<div class=\"popupContent\"><div class=\"button-close-wrapper\"><div class=\"button-close\" id=\"button-close-portfolio-entry\"></div></div></div>");
  $(".popupContent").css({
    "position": "absolute",
    "display": "block",
    "top": $("#" + portfolioId).offset().top,
    "left": $("#" + portfolioId).offset().left,
    // "height": "0px",
    "width": "0px",
  });
}

function zoomImageFullScreen(selectedImage){
  if (selectedImage == "cv-image"){
    var biggerImageUrl = "https://s3-us-west-2.amazonaws.com/sidneysservices/personaldocuments/My+CV.jpg";
  }
  if($("#fullscreen-blur").length == 0){
    $("#" + selectedImage).parent().append("<div id=\"fullscreen-blur\"></div>");
    var selectedImageRatio = $("#" + selectedImage)[0].naturalWidth / $("#" + selectedImage)[0].naturalHeight;
    if (selectedImageRatio > (windowWidth()/ windowHeight())){
      // Go full width
      var selectedImageWidth = windowWidth();
      var selectedImageHeight = selectedImageWidth / selectedImageRatio;
      var selectedImageStartingPositionVertical = (windowHeight() - selectedImageHeight) / 2;
      var selectedImageStartingPositionHorizontal = 0
    } else {
      // Go full height
      var selectedImageHeight = windowHeight();
      var selectedImageWidth = selectedImageHeight * selectedImageRatio;
      var selectedImageStartingPositionVertical = 0;
      var selectedImageStartingPositionHorizontal = (windowWidth() - selectedImageWidth) / 2;
    }
    var selectedImageCurrentTop = $("#" + selectedImage).offset().top;
    var selectedImageCurrentLeft = $("#" + selectedImage).offset().left;
    var selectedImageCurrentHeight = $("#" + selectedImage).height();
    var selectedImageCurrentWidth = $("#" + selectedImage).width();

    $("#" + selectedImage).css({
      "position": "fixed",
      "height": selectedImageCurrentHeight,
      "width": selectedImageCurrentWidth,
      "top": selectedImageCurrentTop,
      "left": selectedImageCurrentLeft,
      "z-index": "5"
    });

    $("#" + selectedImage).animate({
      "height": selectedImageHeight,
      "width": selectedImageWidth,
      "top": selectedImageStartingPositionVertical,
      "left": selectedImageStartingPositionHorizontal
    }, 300, function(){
      if (biggerImageUrl != undefined && biggerImageUrl != "" && biggerImage != $("#" + selectedImage).attr("src")){
        var biggerImage = new Image();
        biggerImage.src = biggerImageUrl;
        biggerImage.onload = function(){
          $("#" + selectedImage).attr("src", biggerImageUrl);
        };
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
  $("#" + currentZoommingImage).css({
    "position": "relative",
    "top": "auto",
    "left": "auto",
    "height": "auto",
    "width": currentZoommingImageWidthCss,
    "z-index": "1"
  });
}

function setHeaderButtonsHighlight(clkedBtn){
  $(".ch-item").css("background-color", "rgba(0,0,0,0)");
  $("#" + clkedBtn).css("background-color", "rgba(112,188,217, 0.5)");
}

function getPages(pageId){
  for (var i = 0; i < $("img").length; i++) {
    getImageSize($("img")[i], function(iwidth, iheight){
      $($("img")[i]).height(iheight);
      $($("img")[i]).width(iwidth);
    });
  }
  clearInterval(bannerSwitchingInterval);
  setHeaderButtonsHighlight(pageId);
  $.ajax({
    method: "POST",
    url: "/" + pageId,
    data: {}
  })
  .done(function(msg) {
    pageTransform(msg, pageId);
  })
  .fail(function() {
    // alert( "error" );
  });
}

function pageTransform(pageContent, currentPageId){
  if (!checkExistedPage(currentPageId)){
    $("#innerBody").append("<div class=\"content-container\" id=\"content-container-" + currentPageId + "\"></div>")
    pagesArray.push(currentPageId);
    $("#content-container-" + currentPageId).css({
      "width": "100vw",
      "top": windowHeight(),
      "min-height" : windowHeight() - $(".navigator-top").height()
    });
  } else {
    $("#content-container-" + currentPageId).css({
      "width": "100vw",
      "min-height" : windowHeight() - $(".navigator-top").height()
    });
  }
  $("#content-container-" + currentPageId).html(pageContent);
  if ($("#content-container-" + currentPageId + " img").length > 0){
    // $("#content-container-" + currentPageId + " img").load(function(){
      resetPagesPosition(currentPageId);
    // });
  } else {
    resetPagesPosition(currentPageId);
  }

}

function resetPagesPosition(currentPageId){
  var isPassed = false;
  for (var i = 0; i < pagesArray.length; i++) {
    if (!isPassed) {
      // Scroll pages that come before the selected
      resetPagesComeBeforeTheSelected(pagesArray[i], currentPageId)
    } else {
      // Scroll and slide down pages that come after the selected
      $("#content-container-" + pagesArray[i]).animate({
        "top": $("#content-container-" + pagesArray[i - 1]).height(),
        "opacity": 0
      }, 500, function(){
        $(this).remove();
      });
      checkExistedPageAndDelete(pagesArray[i]);
      i--;
    }
    if (pagesArray[i] == currentPageId) {
      isPassed = true;
    }
  }
}

function resetPagesComeBeforeTheSelected(pagei, currentPageId){
  readjustFooter(currentPageId);
  $("#content-container-" + pagei).animate({
    "top": $(".navigator-top").height(),
    "opacity": 1
  }, 500, function(){
    if (pagei != currentPageId) {
      $("#content-container-" + pagei).html("");
    }
  });
}

function readjustFooter(currentPage, loaded){
  if (loaded == "loaded"){
    $("body").css("height", $("#content-container-" + currentPage).outerHeight() + $("#content-container-" + currentPage).offset().top);
    $("body").css({
      "height": $("#content-container-" + currentPage).outerHeight() + $(".navigator-top").height()
    });
  } else {
    $("body").css("height", $("#content-container-" + currentPage).outerHeight() + $("#content-container-" + currentPage).offset().top);
    $("body").animate({
      "height": $("#content-container-" + currentPage).outerHeight() + $(".navigator-top").height()
    }, 500);
  }
}

function checkExistedPage(givenPage){
  for (var i = 0; i < pagesArray.length; i++) {
    if (pagesArray[i] == givenPage) {
      return true;
    }
  }
  return false;
}

function checkExistedPageAndDelete(givenPage){
  for (var i = 0; i < pagesArray.length; i++) {
    if (pagesArray[i] == givenPage) {
      pagesArray.splice(i, 1);
    }
  }
  return false;
}

function switchBanners(){
  bannerHovers = new Array();
  currentHoverCount = 0;

  arrayOfAnimation = [
    toggleDisplayMosaicDissolve,
    toggleDisplayDissolve
  ];

  var el = $('#banner1');
  el.width(width).height(height);

  horizontal_pieces = 5;
  vertical_pieces = 5;
  total_pieces = horizontal_pieces * vertical_pieces;

  box_width =width/ horizontal_pieces;
  box_height = height / vertical_pieces;

  for (i=0; i<total_pieces; i++)
  {
    var tempEl = $('<span class="hover" id="hover-' + i + '"></span>');

    el.append(tempEl);
    bannerHovers.push(tempEl);
  }
  $('#banner1 .hover').width(box_width).height(box_height);

  getBanner("#banner1");

  // var marked = 0;
  bannerSwitchingInterval = setInterval(function(){
    if (bannerHovers[0].css('opacity') == 0) {
      getBanner("#banner1 span.hover");
    } else {
      getBanner("#banner1");
    }
    // if (marked == 0){
    //   // clearInterval(theInterval);
    // }
    //
    // marked++;
  }, 5000);
}

function getBanner(bannerId){
  $.ajax({
    method: "POST",
    url: "/banners",
    data: {}
  })
  .done(function(msg) {
    pic = new Image();
    pic.onload = function(){
      setBannerHoversPosition(pic.naturalHeight, pic.naturalWidth, bannerId);
      $(bannerId).css("background-image", "url(\"" + pic.src + "\")");
      var randomNumber = Math.floor((Math.random() * arrayOfAnimation.length) + 1);
      arrayOfAnimation[randomNumber % arrayOfAnimation.length]();
    };
    pic.src = msg.url;

  })
  .fail(function() {
    // alert( "error" );
  });
};

function setBannerHoversPosition(picHeight, picWidth, bannerId){
  var imageRatio = picWidth/picHeight;
  var windowRatio = width/height;

  if (imageRatio > windowRatio){
    // Go full height
    if (bannerId != "#banner1") {
      var zoomProperty = picWidth /width* vertical_pieces * 100;
      $(bannerId).css("background-size", zoomProperty + "% " + vertical_pieces * 100 + "%" );
    } else {
      var zoomProperty = picWidth /width* 100;
      $(bannerId).css("background-size", zoomProperty + "% 100%" );
    }

    var vertical_position = 0;
    var beginningHoriPos = (picWidth - box_width * horizontal_pieces)/2;
  } else {
    // Go full width
    if (bannerId != "#banner1") {
      var zoomProperty = picHeight / height * horizontal_pieces * 100;
      $(bannerId).css("background-size", horizontal_pieces * 100 + "% " + zoomProperty + "%" );
    } else {
      var zoomProperty = picHeight / height * 100;
    $(bannerId).css("background-size", "100% " + zoomProperty + "%" );
    }

    var beginningHoriPos = 0;
    var vertical_position = (picHeight - box_height * vertical_pieces)/2;
  }

  if (bannerId != "#banner1") {
    for (i=0; i<total_pieces; i++)
    {
      var horizontal_position = beginningHoriPos + (i % horizontal_pieces) * box_width;

      if(i > 0 && i % horizontal_pieces == 0)
      {
        vertical_position += box_height;
      }

      bannerHovers[i].css('background-position', '-' + horizontal_position + 'px -' + vertical_position + 'px');
    }
  } else {
    $(bannerId).css('background-position', '-' + beginningHoriPos + 'px -' + vertical_position + 'px');
  }
}

function toggleDisplayMosaicDissolve()
{
  var tempEl = bannerHovers[currentHoverCount];

  if (currentHoverCount == 0) {
    var opacity = tempEl.css("opacity");
    if(opacity == 0)
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
    tempEl.animate({ opacity: 1 })
  }
  else
  {
    tempEl.animate({ opacity: 0 })
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

  if (currentHoverCount == 0) {
    var opacity = tempEl.css('opacity');
    if(opacity == 0)
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
    tempEl.animate({ opacity: 1 }, 150);
    tempEl.animateRotate(360, 300, "linear", function(){
          // console.log(this); //this is supposed to be the DOM node, but it isn't
      });
    // tempEl.animate({ opacity: 1 });
  }
  else
  {
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

  if (currentHoverCount == 0) {
    var opacity = tempEl.css('opacity');
    if(opacity == 0)
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

  if (currentHoverCount == 0) {
    var opacity = tempEl.css("opacity");
    if(opacity == 0)
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
