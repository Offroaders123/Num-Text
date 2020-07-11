var linedAutomatics = document.querySelectorAll("[data-lined-automatic]");
linedAutomatics.forEach(function(textarea){
  var container = document.createElement("span");
  textarea.parentElement.insertBefore(container,textarea);
  container.appendChild(textarea);
  textarea.removeAttribute("data-lined-automatic");
  container.dataset.linedContainer = true;
});
var linedContainers = Array.from(document.querySelectorAll("[data-lined-container]"));
linedContainers.forEach(function(container){
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
    var scrollbarHeight = textarea.offsetHeight - textarea.clientHeight;
    if (scrollbarHeight > 0){
      lineCount.style.paddingBottom = `${parseInt(window.getComputedStyle(lineCount).getPropertyValue("padding-top")) + scrollbarHeight}px`;
    } else {
      lineCount.style.removeProperty("padding-bottom");
    }
    lineCount.scrollTop = textarea.scrollTop;
  });
});
function updateLineCount(textarea){
  var lineCount = textarea.parentElement.getElementsByTagName("ol")[0];
  var previousCount = textarea.dataset.rows;
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
  textarea.dataset.rows = currentCount;
}
function toggleLineCount(element){
  var currentState = element.dataset.linedHidden;
  if (currentState == undefined){
    element.dataset.linedHidden = true;
  } else {
    element.removeAttribute("data-lined-hidden");
  }
}