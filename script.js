var numberedContainers = Array.from(document.querySelectorAll("[data-numbered-container]"));
numberedContainers.forEach(function(container){
  var lineCount = document.createElement("ol");
  var textarea = container.getElementsByTagName("textarea")[0];
  container.insertBefore(lineCount,textarea);
  updateLineCount(textarea);
  lineCount.addEventListener("click",function(){
    textarea.focus();
  });
  textarea.addEventListener("input",function(){
    updateLineCount(textarea);
  });
  textarea.addEventListener("scroll",function(){
    updateScrollPosition(textarea);
  });
});
function updateLineCount(textarea){
  if (textarea.parentElement.hasAttribute("data-numbered-hidden") == false){console.log("Updated!");
    var lineCount = textarea.parentElement.getElementsByTagName("ol")[0];
    var previousCount = textarea.getAttribute("data-numbered-rows");
    if (previousCount == undefined){
      previousCount = 0;
    }
    var currentCount = textarea.value.split("\n").length;
    var countDifference = currentCount - previousCount;
    if (countDifference != 0){
      for (i = 0; i < Math.abs(countDifference); i++){
        if (countDifference > 0){
          lineCount.appendChild(document.createElement("li"));
        }
        if (countDifference < 0){
          lineCount.lastChild.remove();
        }
      }
    }
    textarea.setAttribute("data-numbered-rows",currentCount);
    updateScrollPosition(textarea);
  }
}
function updateScrollPosition(textarea){
  var lineCount = textarea.parentElement.getElementsByTagName("ol")[0];
  var scrollbarHeight = textarea.offsetHeight - textarea.clientHeight;
  if (scrollbarHeight > 0){
    lineCount.style.paddingBottom = `${parseInt(window.getComputedStyle(lineCount).getPropertyValue("padding-top")) + scrollbarHeight}px`;
  } else {
    lineCount.style.removeProperty("padding-bottom");
  }
  lineCount.scrollTop = textarea.scrollTop;
}
function toggleLineCount(textarea){
  if (textarea.parentElement.hasAttribute("data-numbered-hidden")){
    textarea.parentElement.removeAttribute("data-numbered-hidden");
    updateLineCount(textarea);
  } else {
    textarea.parentElement.setAttribute("data-numbered-hidden",true);
  }
}